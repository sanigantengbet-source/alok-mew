import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';
import { safeFetchYouTube } from '@/lib/youtube-fetch';
import { INITIAL_SHORTS } from '@/data/shorts';

// Rich, high-velocity topic & search pools for dynamic, fresh TikTok/Shorts FYP recommendations
const LIVE_SHORTS_TOPIC_POOLS: { target: string; label: string }[] = [
  // 1. Core Trending & FYP
  { target: 'shorts viral trending terbaru fyp', label: 'Trending Shorts' },
  { target: 'fyp viral tiktok shorts trending', label: 'FYP Viral' },
  { target: 'shorts trending indonesia viral', label: 'Trending Indo' },

  // 2. Comedy & Entertainment (Humor)
  { target: 'shorts sketsa komedi lucu ngakak viral', label: 'Sketsa Komedi' },
  { target: 'shorts video lucu bikin ngakak kocak', label: 'Momen Ngakak' },
  { target: 'shorts stand up comedy lucu viral', label: 'Komedi Lucu' },

  // 3. Gaming & Streamer
  { target: 'shorts gaming streamer epic moments viral', label: 'Gaming Viral' },
  { target: 'shorts game play seru lucu indonesia', label: 'Gaming Indo' },

  // 4. Kuliner & Food
  { target: 'shorts review makanan viral street food enak', label: 'Kuliner Viral' },
  { target: 'shorts mukbang asmr kuliner street food', label: 'Street Food' },

  // 5. Tech & Gadget
  { target: 'shorts gadget canggih teknologi unik terbaru', label: 'Gadget Unik' },
  { target: 'shorts tips trik hp teknologi inovasi', label: 'Tech Innovation' },

  // 6. Music & Sounds
  { target: 'shorts lagu hits viral tiktok sound terbaru', label: 'Musik Viral' },

  // 7. Fakta Unik & Populer
  { target: 'shorts fakta menarik dunia terpopuler unik seru', label: 'Fakta Menarik' },
  { target: 'shorts momen unik heboh viral media sosial', label: 'Momen Heboh' },
];

// Helper to scrape shorts directly from YouTube HTML ytInitialData
async function scrapeShortsFromYouTube(source: { target: string; label: string } | string) {
  try {
    let queryTerm = '';
    if (typeof source === 'string') {
      queryTerm = source.replace(/^#/, '').trim();
    } else {
      queryTerm = source.target;
    }

    if (!queryTerm.toLowerCase().includes('short')) {
      queryTerm += ' #shorts';
    }

    // sp=EgIQAQ%253D%253D filters by Video, preventing hashtag redirect loops
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(queryTerm)}&sp=EgIQAQ%253D%253D`;

    const html = await safeFetchYouTube(searchUrl, 2, 5000);
    if (!html) return [];

    const match =
      html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
      html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/) ||
      html.match(/ytInitialData\s*=\s*({.+?});/);

    if (!match || !match[1]) return [];

    const parsed = JSON.parse(match[1]);
    const results: any[] = [];
    const seen = new Set<string>();

    function walk(node: any) {
      if (!node || typeof node !== 'object') return;

      // 1. Modern shortsLockupViewModel
      if (node.shortsLockupViewModel?.entityId) {
        const s = node.shortsLockupViewModel;
        const rawId = s.entityId.replace('shorts-shelf-item-', '').trim();
        const videoId = rawId.length === 11 ? rawId : (rawId.match(/[a-zA-Z0-9_-]{11}/)?.[0] || '');

        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);
          const accessibilityText = s.accessibilityText || '';
          const parts = accessibilityText.split(',');
          const title = parts[0]?.trim() || s.overlayMetadata?.primaryText?.content || 'Trending YouTube Short';
          const numericViews = parseYouTubeViews(parts[1] || s.overlayMetadata?.secondaryText?.content || accessibilityText, null, 780000);

          results.push({
            id: `short-yt-${videoId}`,
            youtubeId: videoId,
            title: title,
            description: `Trending YouTube Short: ${title}`,
            channelTitle: 'Trending Creator',
            channelId: `c-${videoId}`,
            channelAvatar: `https://picsum.photos/seed/${videoId}/100/100`,
            subscriberCount: '500K+',
            verified: true,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            views: numericViews,
            likes: Math.floor(numericViews * 0.08) || 52000,
            dislikes: 28,
            uploadedAt: 'Trending Baru',
            duration: '0:50',
            category: 'Shorts',
            tags: ['Shorts', 'Viral', 'Trending', 'FYP'],
            commentsCount: Math.floor(numericViews * 0.003) || 1200,
          });
        }
      }

      // 2. reelItemRenderer (Classic Shorts)
      if (node.reelItemRenderer?.videoId) {
        const r = node.reelItemRenderer;
        const videoId = r.videoId;
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);
          const title = r.headline?.simpleText || r.headline?.runs?.[0]?.text || 'Trending Short';
          const numericViews = parseYouTubeViews(r.viewCountText, null, 650000);
          results.push({
            id: `short-yt-${videoId}`,
            youtubeId: videoId,
            title,
            description: `YouTube Short: ${title}`,
            channelTitle: r.ownerText?.runs?.[0]?.text || 'Trending Creator',
            channelId: `c-${videoId}`,
            channelAvatar: `https://picsum.photos/seed/${videoId}/100/100`,
            subscriberCount: '450K',
            verified: true,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            views: numericViews,
            likes: Math.floor(numericViews * 0.07) || 45000,
            dislikes: 18,
            uploadedAt: 'Trending Baru',
            duration: '0:45',
            category: 'Shorts',
            tags: ['Shorts', 'Viral', 'Trending', 'FYP'],
            commentsCount: Math.floor(numericViews * 0.002) || 850,
          });
        }
      }

      // 3. videoRenderer in hashtag / search / richItem
      if (node.videoRenderer?.videoId) {
        const v = node.videoRenderer;
        const videoId = v.videoId;
        const title = v.title?.runs?.[0]?.text || v.title?.simpleText || '';
        const duration = v.lengthText?.simpleText || '';
        const isShortDuration = duration.startsWith('0:') || duration === '1:00' || title.toLowerCase().includes('#short') || duration === '';

        if (videoId && isShortDuration && !seen.has(videoId)) {
          seen.add(videoId);
          const numericViews = parseYouTubeViews(v.viewCountText, v.shortViewCountText, 520000);
          const channelName =
            v.ownerText?.runs?.[0]?.text ||
            v.shortBylineText?.runs?.[0]?.text ||
            'Kreator YouTube';
          const uploadedAt =
            v.publishedTimeText?.simpleText ||
            (Array.isArray(v.publishedTimeText?.runs) ? v.publishedTimeText.runs.map((r: any) => r.text).join('') : '') ||
            'Baru Saja';

          results.push({
            id: `short-yt-${videoId}`,
            youtubeId: videoId,
            title: title || 'Trending Short',
            description: `Trending Short: ${title}`,
            channelTitle: channelName,
            channelId: `c-${videoId}`,
            channelAvatar:
              v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
              `https://picsum.photos/seed/${encodeURIComponent(channelName || videoId)}/100/100`,
            subscriberCount: '350K+',
            verified: Boolean(v.ownerBadges?.length),
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            views: numericViews,
            likes: Math.floor(numericViews * 0.08) || 35000,
            dislikes: 14,
            uploadedAt: uploadedAt,
            duration: duration || '0:50',
            category: 'Shorts',
            tags: ['Shorts', 'Viral', 'Trending', 'FYP'],
            commentsCount: Math.floor(numericViews * 0.003) || 450,
          });
        }
      }

      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(parsed);
    return results;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qParam = searchParams.get('q');

  let targetSources: (typeof LIVE_SHORTS_TOPIC_POOLS[0] | string)[] = [];

  if (qParam && qParam.trim()) {
    targetSources = [qParam.trim()];
  } else {
    // Pick 4-5 random topics across distinct genres for diverse TikTok-like FYP feed
    const shuffled = [...LIVE_SHORTS_TOPIC_POOLS].sort(() => 0.5 - Math.random());
    targetSources = shuffled.slice(0, 4);
  }

  const allShorts: any[] = [];
  const seenIds = new Set<string>();

  try {
    const promises = targetSources.map(async (src) => {
      // 1. Live Scrape from YouTube hashtag/search
      const scraped = await scrapeShortsFromYouTube(src);
      if (scraped && scraped.length > 0) {
        return scraped;
      }

      // 2. Fast fallback to youtube-sr search
      try {
        const queryTerm = typeof src === 'string' ? src : src.target;
        const srResults = await YouTube.search(`${queryTerm} #shorts`, {
          limit: 15,
          type: 'video',
        });

        return (srResults || [])
          .filter((item: any) => item && item.id && item.title)
          .map((item: any) => {
            const videoId = item.id;
            const thumb =
              item.thumbnail?.url ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            return {
              id: `short-yt-${videoId}`,
              youtubeId: videoId,
              title: item.title,
              description: item.description || `Trending Short: ${item.title}`,
              channelTitle: item.channel?.name || 'Trending Creator',
              channelId: item.channel?.id || `c-${item.channel?.name?.replace(/\s+/g, '-').toLowerCase() || videoId}`,
              channelAvatar:
                item.channel?.icon?.url ||
                `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || videoId || 'shortcreator')}/100/100`,
              subscriberCount: item.channel?.subscribers || '600K',
              verified: Boolean(item.channel?.verified),
              thumbnailUrl: thumb,
              views: typeof item.views === 'number' ? item.views : 750000,
              likes: Math.floor((item.views || 350000) * 0.08) || 32000,
              dislikes: 20,
              uploadedAt: item.uploadedAt || 'Trending Baru',
              duration: item.durationFormatted || '0:50',
              category: 'Shorts',
              tags: ['Shorts', 'Viral', 'Trending', 'FYP'],
              commentsCount: Math.floor((item.views || 350000) * 0.004) || 950,
            };
          });
      } catch {
        return [];
      }
    });

    const resultsByTopic = await Promise.all(promises);

    // Interleave topic results for optimal FYP variation (comedy -> gaming -> viral -> tech -> food)
    let maxLen = 0;
    for (const list of resultsByTopic) {
      if (list.length > maxLen) maxLen = list.length;
    }

    for (let i = 0; i < maxLen; i++) {
      for (const topicList of resultsByTopic) {
        if (topicList[i]) {
          const item = topicList[i];
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allShorts.push(item);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Shorts fetch pool notice:', error);
  }

  // Fallback to INITIAL_SHORTS if upstream is rate-limited or sparse
  if (allShorts.length < 5) {
    for (const item of INITIAL_SHORTS) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allShorts.push(item);
      }
    }
  }

  // Shuffle slightly so every single user visit & refresh gets a completely fresh, exciting order
  const dynamicOrder = [...allShorts].sort(() => 0.5 - Math.random());

  return NextResponse.json(
    {
      results: dynamicOrder,
      count: dynamicOrder.length,
      randomSeed: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    }
  );
}
