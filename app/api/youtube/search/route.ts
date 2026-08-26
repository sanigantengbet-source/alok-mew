import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';

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

// Memory cache for recent searches (TTL 2 minutes)
const searchCache = new Map<string, { timestamp: number; results: any[] }>();

// HTML scraper parser to extract full ytInitialData search results
async function searchViaYouTubeHTML(query: string, limit = 50) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const html = await res.text();
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
      const duration =
        video.lengthText?.simpleText ||
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
  } catch (err) {
    console.warn('YouTube HTML search parser error:', err);
    return [];
  }
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
      subscriberCount: '100K',
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
    } catch (e) {
      console.log('Direct video info enrichment notice:', e);
    }

    return NextResponse.json({ results: [directResult] });
  }

  // Check cache
  const cacheKey = cleanQuery.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 90 * 1000 && cached.results.length >= 10) {
    return NextResponse.json({ results: cached.results, count: cached.results.length, cached: true });
  }

  // 2. Perform parallel search using HTML scraper + YouTube API
  let combinedResults: any[] = [];
  const seenIds = new Set<string>();

  try {
    const [htmlResults, srResults] = await Promise.allSettled([
      searchViaYouTubeHTML(cleanQuery, limit),
      YouTube.search(cleanQuery, {
        limit: Math.min(limit, 50),
        type: 'video',
        safeSearch: false,
      }).catch(() => []),
    ]);

    // Add HTML scraper results first (they are rich in exact real order)
    if (htmlResults.status === 'fulfilled' && Array.isArray(htmlResults.value)) {
      for (const item of htmlResults.value) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          combinedResults.push(item);
        }
      }
    }

    // Supplement with youtube-sr results
    if (srResults.status === 'fulfilled' && Array.isArray(srResults.value)) {
      for (const item of srResults.value) {
        if (!item || !item.id || !item.title) continue;
        const id = `yt-${item.id}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          const thumb =
            item.thumbnail?.url ||
            `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

          combinedResults.push({
            id,
            youtubeId: item.id,
            title: item.title,
            description: item.description || `Tonton "${item.title}" oleh ${item.channel?.name || 'kreator'} di NextTube.`,
            channelTitle: item.channel?.name || 'YouTube Creator',
            channelId: item.channel?.id || `c-${item.channel?.name?.replace(/\s+/g, '-').toLowerCase() || item.id}`,
            channelAvatar:
              item.channel?.icon?.url ||
              `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || item.id || 'creator')}/100/100`,
            subscriberCount: item.channel?.subscribers || '250K+',
            verified: Boolean(item.channel?.verified),
            thumbnailUrl: thumb,
            views: typeof item.views === 'number' ? item.views : 45000,
            likes: Math.floor((item.views || 40000) * 0.04) || 1200,
            dislikes: 12,
            uploadedAt: item.uploadedAt || 'Baru saja',
            duration: item.durationFormatted || '10:00',
            category: 'Pencarian YouTube',
            tags: [item.channel?.name || 'YouTube', 'Video', 'Pencarian'],
            commentsCount: Math.floor((item.views || 40000) * 0.002) || 45,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Search execution error:', err);
  }

  // Save to cache if results found
  if (combinedResults.length > 0) {
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      results: combinedResults,
    });
  }

  return NextResponse.json({
    results: combinedResults,
    count: combinedResults.length,
  });
}

