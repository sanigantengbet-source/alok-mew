import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';

// Rich, high-velocity topic & hashtag pools for dynamic, fresh TikTok/Shorts FYP recommendations
const LIVE_SHORTS_TOPIC_POOLS: { type: 'hashtag' | 'search'; target: string; label: string }[] = [
  // 1. Core Trending & FYP
  { type: 'hashtag', target: 'shorts', label: 'Trending Shorts' },
  { type: 'hashtag', target: 'fyp', label: 'FYP Viral' },
  { type: 'hashtag', target: 'viral', label: 'Viral Hot' },
  { type: 'hashtag', target: 'trending', label: 'Trending Now' },
  { type: 'hashtag', target: 'indonesia', label: 'Trending Indo' },

  // 2. Comedy & Entertainment (Humor)
  { type: 'hashtag', target: 'lucu', label: 'Komedi Lucu' },
  { type: 'hashtag', target: 'ngakak', label: 'Momen Ngakak' },
  { type: 'hashtag', target: 'komedi', label: 'Sketsa Komedi' },
  { type: 'search', target: '#shorts sketsa komedi lucu viral terbaru', label: 'Sketsa Lucu' },

  // 3. Gaming & Streamer
  { type: 'hashtag', target: 'game', label: 'Gaming Viral' },
  { type: 'hashtag', target: 'gaming', label: 'Streamer Gaming' },
  { type: 'search', target: '#shorts gaming viral seru indonesia', label: 'Gaming Indo' },

  // 4. Kuliner & Food
  { type: 'hashtag', target: 'kuliner', label: 'Kuliner Viral' },
  { type: 'hashtag', target: 'makanan', label: 'Street Food' },
  { type: 'search', target: '#shorts review makanan viral street food', label: 'Food Review' },

  // 5. Tech & Gadget
  { type: 'hashtag', target: 'gadget', label: 'Gadget Unik' },
  { type: 'hashtag', target: 'teknologi', label: 'Teknologi Canggih' },
  { type: 'search', target: '#shorts gadget canggih inovasi unik', label: 'Tech Innovation' },

  // 6. Music & Sounds
  { type: 'hashtag', target: 'musik', label: 'Musik Viral' },
  { type: 'search', target: '#shorts lagu hits viral tiktok sound 2026', label: 'TikTok Hits' },

  // 7. Fakta Unik & Populer
  { type: 'hashtag', target: 'faktaunik', label: 'Fakta Menarik' },
  { type: 'search', target: '#shorts fakta menarik dunia terpopuler', label: 'Fakta Seru' },
  { type: 'search', target: '#shorts momen unik heboh media sosial', label: 'Momen Heboh' },
];

// Helper to scrape shorts directly from YouTube HTML ytInitialData
async function scrapeShortsFromYouTube(source: { type: 'hashtag' | 'search'; target: string; label: string } | string) {
  try {
    let searchUrl = '';
    if (typeof source === 'string') {
      if (source.startsWith('http')) {
        searchUrl = source;
      } else if (source.startsWith('#')) {
        searchUrl = `https://www.youtube.com/hashtag/${encodeURIComponent(source.replace(/^#/, ''))}`;
      } else {
        // sp=CAISAhAB sorts by latest upload date + video format
        searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(source + ' #shorts')}&sp=CAISAhAB`;
      }
    } else if (source.type === 'hashtag') {
      searchUrl = `https://www.youtube.com/hashtag/${encodeURIComponent(source.target)}`;
    } else {
      searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(source.target)}&sp=CAISAhAB`;
    }

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
  } catch (err) {
    console.warn('YouTube Shorts scraper notice:', err);
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

  // Shuffle slightly so every single user visit & refresh gets a completely fresh, exciting order
  const dynamicOrder = [...allShorts].sort(() => 0.5 - Math.random());

  return NextResponse.json({
    results: dynamicOrder,
    count: dynamicOrder.length,
    randomSeed: Date.now(),
  });
}
