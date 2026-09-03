import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';
import { safeFetchYouTube } from '@/lib/youtube-fetch';
import { searchViaInnerTube, searchViaInvidious } from '@/lib/youtube-innertube';
import { INITIAL_VIDEOS } from '@/data/videos';
import { Video } from '@/types';

// Helper to extract YouTube video ID if user searched a URL directly
function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pure 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // URL patterns (standard, shorts, embed, youtu.be)
  const urlPatterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  ];

  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Memory cache for recent searches (TTL 5 minutes for extreme high performance)
const searchCache = new Map<string, { timestamp: number; results: any[] }>();

// HTML scraper parser to extract full ytInitialData search results
async function searchViaYouTubeHTML(query: string, limit = 40) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const html = await safeFetchYouTube(searchUrl, 2, 4500);
    if (!html) return [];

    const jsonMatch =
      html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
      html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/) ||
      html.match(/ytInitialData\s*=\s*({.+?});/);

    if (!jsonMatch || !jsonMatch[1]) return [];

    const data = JSON.parse(jsonMatch[1]);
    const sectionList =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    const results: any[] = [];
    const seenIds = new Set<string>();

    function processVideoRenderer(video: any) {
      if (!video || !video.videoId || results.length >= limit) return;
      const videoId = video.videoId;
      if (seenIds.has(videoId)) return;
      seenIds.add(videoId);

      const title =
        video.title?.runs?.[0]?.text ||
        video.title?.simpleText ||
        '';
      if (!title || title.length < 2) return;

      const channelTitle =
        video.ownerText?.runs?.[0]?.text ||
        video.shortBylineText?.runs?.[0]?.text ||
        'YouTube Creator';
      const channelId =
        video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
        video.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
        `c-${videoId}`;
      const channelAvatar =
        video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
        `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`;

      const uploadedText =
        video.publishedTimeText?.simpleText ||
        (Array.isArray(video.publishedTimeText?.runs) ? video.publishedTimeText.runs.map((r: any) => r.text).join('') : '') ||
        'Baru saja';
      const hasLiveBadge =
        video.badges?.some((b: any) => {
          const label = b?.metadataBadgeRenderer?.label || b?.metadataBadgeRenderer?.style || '';
          return /live/i.test(label);
        }) ||
        video.thumbnailOverlays?.some((o: any) => {
          const style = o?.thumbnailOverlayTimeStatusRenderer?.style || '';
          const text =
            o?.thumbnailOverlayTimeStatusRenderer?.text?.runs?.[0]?.text ||
            o?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ||
            '';
          return /live/i.test(style) || /live/i.test(text);
        });

      const isLive = Boolean(
        hasLiveBadge ||
        (!video.lengthText &&
          (/\b(LIVE\s+STREAMING|SIARAN\s+LANGSUNG|24\s*JAM\s+NONSTOP)\b/i.test(title) ||
           /(?:^|\s|🔴)LIVE\b/i.test(title)))
      );

      const duration = isLive
        ? 'LIVE'
        : video.lengthText?.simpleText ||
          (Array.isArray(video.lengthText?.runs) ? video.lengthText.runs.map((r: any) => r.text).join('') : '') ||
          '10:00';
      const thumb =
        video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const numericViews = parseYouTubeViews(video.viewCountText, video.shortViewCountText, 65000);

      results.push({
        id: `yt-${videoId}`,
        youtubeId: videoId,
        title,
        description:
          video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
          `Tonton video "${title}" di NextTube.`,
        channelTitle,
        channelId,
        channelAvatar,
        subscriberCount: '500K+',
        verified: Boolean(video.ownerBadges?.length || video.badges?.length),
        thumbnailUrl: thumb,
        views: numericViews,
        likes: Math.round(numericViews * 0.04) || 1500,
        dislikes: 10,
        uploadedAt: uploadedText,
        duration,
        category: 'Hasil Pencarian',
        tags: [channelTitle, 'Video', 'Pencarian'],
        commentsCount: Math.round(numericViews * 0.002) || 95,
        isLive,
      });
    }

    function walk(node: any) {
      if (!node || typeof node !== 'object' || results.length >= limit) return;
      if (node.videoRenderer) {
        processVideoRenderer(node.videoRenderer);
      }
      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    for (const section of sectionList) {
      walk(section);
      if (results.length >= limit) break;
    }

    return results;
  } catch {
    return [];
  }
}

// Fallback search inside curated dataset
function searchCuratedVideos(query: string): Video[] {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter(Boolean);

  return INITIAL_VIDEOS.filter((v) => {
    const title = v.title.toLowerCase();
    const desc = v.description.toLowerCase();
    const chan = v.channelTitle.toLowerCase();
    const cat = v.category.toLowerCase();
    const tags = v.tags.map((t) => t.toLowerCase());

    if (title.includes(q) || desc.includes(q) || chan.includes(q) || cat.includes(q) || tags.some((t) => t.includes(q))) {
      return true;
    }

    return words.some(
      (w) =>
        title.includes(w) ||
        chan.includes(w) ||
        tags.some((t) => t.includes(w)) ||
        desc.includes(w)
    );
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const cleanQuery = query.trim();

  // 1. Direct YouTube link or video ID detection
  const directVideoId = extractYouTubeVideoId(cleanQuery);
  if (directVideoId) {
    const directResult = {
      id: `yt-${directVideoId}`,
      youtubeId: directVideoId,
      title: `YouTube Video (${directVideoId})`,
      description: `Watch this video directly on NextTube player with real-time comments, share, and like controls.`,
      channelTitle: 'YouTube Creator',
      channelId: `c-${directVideoId}`,
      channelAvatar: `https://picsum.photos/seed/${directVideoId}/100/100`,
      subscriberCount: '100K+',
      verified: true,
      thumbnailUrl: `https://i.ytimg.com/vi/${directVideoId}/hqdefault.jpg`,
      views: 125000,
      likes: 4500,
      dislikes: 20,
      uploadedAt: 'Recently',
      duration: '10:00',
      category: 'Direct Video',
      tags: ['YouTube', 'Video', directVideoId],
      commentsCount: 120,
    };

    try {
      const v = await YouTube.getVideo(`https://www.youtube.com/watch?v=${directVideoId}`).catch(() => null);
      if (v) {
        directResult.title = v.title || directResult.title;
        directResult.channelTitle = v.channel?.name || directResult.channelTitle;
        directResult.thumbnailUrl = v.thumbnail?.url || directResult.thumbnailUrl;
        directResult.duration = v.durationFormatted || directResult.duration;
        directResult.views = typeof v.views === 'number' ? v.views : directResult.views;
      }
    } catch {}

    return NextResponse.json(
      { results: [directResult] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  }

  // Check L1 In-Memory Cache (TTL: 5 minutes)
  const cacheKey = cleanQuery.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000 && cached.results.length >= 6) {
    return NextResponse.json(
      { results: cached.results, count: cached.results.length, cached: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    );
  }

  // 2. Multi-tier Parallel Search Execution
  let combinedResults: any[] = [];
  const seenIds = new Set<string>();

  try {
    // Launch Tier 1 (InnerTube API) and Tier 2 (HTML scraper) simultaneously
    const [innerTubeRes, htmlRes] = await Promise.allSettled([
      searchViaInnerTube(cleanQuery, limit),
      searchViaYouTubeHTML(cleanQuery, limit),
    ]);

    if (innerTubeRes.status === 'fulfilled' && Array.isArray(innerTubeRes.value)) {
      for (const item of innerTubeRes.value) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          combinedResults.push(item);
        }
      }
    }

    if (htmlRes.status === 'fulfilled' && Array.isArray(htmlRes.value)) {
      for (const item of htmlRes.value) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          combinedResults.push(item);
        }
      }
    }

    // If still sparse, try Tier 3 (Invidious Mirror) + youtube-sr
    if (combinedResults.length < 8) {
      const [invidiousRes, srRes] = await Promise.allSettled([
        searchViaInvidious(cleanQuery, limit),
        YouTube.search(cleanQuery, {
          limit: 25,
          type: 'video',
          safeSearch: false,
        }).catch(() => []),
      ]);

      if (invidiousRes.status === 'fulfilled' && Array.isArray(invidiousRes.value)) {
        for (const item of invidiousRes.value) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            combinedResults.push(item);
          }
        }
      }

      if (srRes.status === 'fulfilled' && Array.isArray(srRes.value)) {
        for (const item of srRes.value) {
          if (!item || !item.id || !item.title) continue;
          const id = `yt-${item.id}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            combinedResults.push({
              id,
              youtubeId: item.id,
              title: item.title,
              description: item.description || `Tonton "${item.title}" di NextTube.`,
              channelTitle: item.channel?.name || 'YouTube Creator',
              channelId: item.channel?.id || `c-${item.id}`,
              channelAvatar:
                item.channel?.icon?.url ||
                `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || item.id)}/100/100`,
              subscriberCount: item.channel?.subscribers || '250K+',
              verified: Boolean(item.channel?.verified),
              thumbnailUrl: item.thumbnail?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              views: typeof item.views === 'number' ? item.views : 45000,
              likes: Math.floor((item.views || 40000) * 0.04) || 1200,
              dislikes: 12,
              uploadedAt: item.uploadedAt || 'Baru saja',
              duration: (item.live || item.durationFormatted === 'LIVE' || /\b(LIVE\s+STREAMING|SIARAN\s+LANGSUNG|24\s*JAM)\b/i.test(item.title || '')) ? 'LIVE' : (item.durationFormatted || '10:00'),
              category: 'Pencarian YouTube',
              tags: [item.channel?.name || 'YouTube', 'Video', 'Pencarian'],
              commentsCount: Math.floor((item.views || 40000) * 0.002) || 45,
              isLive: Boolean(item.live || item.durationFormatted === 'LIVE' || /\b(LIVE\s+STREAMING|SIARAN\s+LANGSUNG|24\s*JAM)\b/i.test(item.title || '')),
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Search execution warning:', err);
  }

  // Tier 4: Fallback to Curated Dataset to GUARANTEE results never return 0
  if (combinedResults.length === 0) {
    const curatedMatches = searchCuratedVideos(cleanQuery);
    if (curatedMatches.length > 0) {
      combinedResults = curatedMatches;
    } else {
      // Return top viral and popular curated videos instead of a blank empty screen
      combinedResults = INITIAL_VIDEOS.slice(0, 10);
    }
  }

  // Save to memory cache
  if (combinedResults.length > 0) {
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      results: combinedResults,
    });
  }

  return NextResponse.json(
    {
      results: combinedResults,
      count: combinedResults.length,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    }
  );
}
