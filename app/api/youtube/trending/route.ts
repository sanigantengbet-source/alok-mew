import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';
import { isFreshAndHotVideo } from '@/lib/video-freshness';
import { safeFetchYouTube } from '@/lib/youtube-fetch';
import { searchViaInnerTube } from '@/lib/youtube-innertube';
import { INITIAL_VIDEOS } from '@/data/videos';

// Diverse topic pools for dynamic and ever-fresh YouTube Home Feed recommendations
const MASTER_TOPIC_POOLS: Record<string, string[]> = {
  Viral: [
    'video viral indonesia terbaru minggu ini',
    'berita viral dan trending terkini indonesia',
    'top trending youtube indonesia hari ini',
    'momen heboh paling rame dibahas netizen',
  ],
  Music: [
    'lagu hits viral tiktok indonesia 2026',
    'top hits music indonesia viral terbaru',
    'lagu pop akustik santai indonesia playlist',
    'official music video indonesia trending',
  ],
  Gaming: [
    'windah basudara game seru terbaru',
    'gameplay seru streamer gamer indonesia',
    'momen lucu kocak gaming streamer indonesia',
  ],
  Tech: [
    'review gadget smartphone terbaru gadgetin',
    'gadget review teknologi terbaru indonesia',
    'smartphone flagship review unboxing 2026',
  ],
  Podcasts: [
    'podcast seru viral indonesia bintang tamu heboh',
    'vindes podcast obrolan seru terbaru',
    'podcast inspiratif cerita pengalaman hidup',
  ],
  Entertainment: [
    'reaksi lucu video trending bikin ngakak',
    'trailer film bioskop indonesia review terbaru',
    'sketsa komedi video viral indonesia',
  ],
  Food: [
    'kuliner viral street food indonesia tanboy kun',
    'review makanan viral paling enak nex carlos',
  ],
  News: [
    'live streaming berita terkini kompas tv cnn',
    'berita hangat viral hari ini indonesia',
  ],
};

function getRandomQueries(explicitCategory?: string): { category: string; query: string }[] {
  if (explicitCategory && explicitCategory.toLowerCase() !== 'all') {
    const cleanCat = explicitCategory.replace(/^[^\w\s]+/, '').trim();
    const catPool = MASTER_TOPIC_POOLS[cleanCat] || MASTER_TOPIC_POOLS[explicitCategory] || [];
    if (catPool.length > 0) {
      const shuffled = [...catPool].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3).map((q) => ({ category: cleanCat, query: q }));
    }
    return [
      { category: cleanCat, query: `${cleanCat} viral indonesia terbaru 2026` },
      { category: cleanCat, query: `${cleanCat} trending populer minggu ini` },
    ];
  }

  const queries: { category: string; query: string }[] = [];
  const categories = Object.keys(MASTER_TOPIC_POOLS);
  const shuffledCats = [...categories].sort(() => 0.5 - Math.random());

  // Pick 5 varied categories per batch to keep load ultra light and fast
  for (const cat of shuffledCats.slice(0, 5)) {
    const pool = MASTER_TOPIC_POOLS[cat];
    const randomIndex = Math.floor(Math.random() * pool.length);
    queries.push({ category: cat, query: pool[randomIndex] });
  }

  return queries;
}

// In-memory short cache to prevent redundant simultaneous requests while keeping feed fresh
const homeCache = new Map<string, { timestamp: number; videos: any[] }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const explicitCategory = searchParams.get('category') || '';
  const dateParam = searchParams.get('date') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const refreshParam = searchParams.get('refresh') === 'true';

  const now = new Date();
  const todayKey = dateParam || `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  const cacheKey = `cat_${explicitCategory || 'all'}_page_${pageParam}`;
  const cached = homeCache.get(cacheKey);

  // Return cached result if valid (cached for 5 minutes)
  if (!refreshParam && cached && Date.now() - cached.timestamp < 5 * 60 * 1000 && cached.videos.length >= 10) {
    const randomized = [...cached.videos].sort(() => 0.5 - Math.random());
    return NextResponse.json(
      {
        results: randomized,
        count: randomized.length,
        page: pageParam,
        source: 'memory-cache',
        dayKey: todayKey,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    );
  }

  try {
    const activeQueries = getRandomQueries(explicitCategory);

    // Fast parallel fetch using InnerTube API with fallback
    const queryPromises = activeQueries.map(async ({ category, query }) => {
      // 1. Tier 1: InnerTube API
      const innerTubeResults = await searchViaInnerTube(query, 12, category);
      if (innerTubeResults.length >= 4) {
        return innerTubeResults;
      }

      // 2. Tier 2: youtube-sr fallback
      try {
        const srList = await YouTube.search(query, {
          limit: 8,
          type: 'video',
          safeSearch: false,
        });

        return (srList || [])
          .filter((item) => item && item.id && item.title)
          .map((item) => {
            const videoId = item.id!;
            const views = typeof item.views === 'number' ? item.views : 350000;
            const isLive = Boolean(
              item.live ||
              item.durationFormatted === 'LIVE' ||
              (!item.durationFormatted && /live/i.test(item.title || '')) ||
              (/\b(LIVE\s+STREAMING|SIARAN\s+LANGSUNG|24\s*JAM\s+NONSTOP)\b/i.test(item.title || '')) ||
              (/(?:^|\s|🔴)LIVE\b/i.test(item.title || '') && (!item.duration || item.duration === 0 || item.durationFormatted === '0:00'))
            );
            return {
              id: `yt-${videoId}`,
              youtubeId: videoId,
              title: item.title || 'YouTube Video',
              description: item.description || `Tonton "${item.title}" di NextTube.`,
              channelTitle: item.channel?.name || 'YouTube Creator',
              channelId: item.channel?.id || `c-${videoId}`,
              channelAvatar:
                item.channel?.icon?.url ||
                `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || videoId)}/100/100`,
              subscriberCount: item.channel?.subscribers || '1M+',
              verified: Boolean(item.channel?.verified),
              thumbnailUrl: item.thumbnail?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              views,
              likes: Math.round(views * 0.045) || 12000,
              dislikes: 12,
              uploadedAt: item.uploadedAt || (isLive ? 'Baru saja' : '1 minggu yang lalu'),
              duration: isLive ? 'LIVE' : (item.durationFormatted || '10:00'),
              category: category || 'Trending',
              tags: [category, item.channel?.name || 'Kreator', 'Trending', 'Viral'],
              commentsCount: Math.round(views * 0.003) || 450,
              isLive,
            };
          });
      } catch {
        return innerTubeResults;
      }
    });

    const resultsByTopic = await Promise.all(queryPromises);

    // Interleave topic results evenly
    const interleaved: any[] = [];
    const seenIds = new Set<string>();
    let maxLen = 0;
    for (const list of resultsByTopic) {
      if (list.length > maxLen) maxLen = list.length;
    }

    for (let i = 0; i < maxLen; i++) {
      for (const topicList of resultsByTopic) {
        if (topicList[i]) {
          const video = topicList[i];
          if (!seenIds.has(video.id)) {
            seenIds.add(video.id);
            interleaved.push(video);
          }
        }
      }
    }

    // Always guarantee dataset fullness by mixing curated videos
    if (interleaved.length < 15) {
      for (const video of INITIAL_VIDEOS) {
        if (!seenIds.has(video.id)) {
          seenIds.add(video.id);
          interleaved.push(video);
        }
      }
    }

    if (interleaved.length > 0) {
      homeCache.set(cacheKey, {
        timestamp: Date.now(),
        videos: interleaved,
      });
    }

    return NextResponse.json(
      {
        results: interleaved,
        count: interleaved.length,
        page: pageParam,
        dayKey: todayKey,
        source: 'live-multi-category-engine',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Trending fetch notice:', error);
    // Return curated fallback so page is NEVER empty or 500
    return NextResponse.json(
      {
        results: INITIAL_VIDEOS,
        count: INITIAL_VIDEOS.length,
        page: pageParam,
        dayKey: todayKey,
        source: 'curated-fallback',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    );
  }
}
