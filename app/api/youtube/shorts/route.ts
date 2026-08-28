import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';
import { safeFetchYouTube } from '@/lib/youtube-fetch';
import { searchShortsViaInnerTube, searchViaInnerTube } from '@/lib/youtube-innertube';
import { INITIAL_SHORTS } from '@/data/shorts';

export const dynamic = 'force-dynamic';

// Rich, high-velocity topic pools across trending TikTok & YouTube Shorts genres
const LIVE_SHORTS_TOPIC_POOLS: { target: string; label: string }[] = [
  // 1. Core Trending & FYP
  { target: 'shorts viral trending fyp terbaru indonesia', label: 'Trending Shorts' },
  { target: 'fyp viral tiktok video trending terbaru', label: 'FYP Viral' },
  { target: 'shorts trending indonesia viral hari ini', label: 'Trending Indo' },

  // 2. Comedy & Entertainment (Humor & Sketsa)
  { target: 'shorts sketsa komedi lucu bikin ngakak kocak viral', label: 'Sketsa Komedi' },
  { target: 'shorts video lucu kocak ngakak fyp', label: 'Momen Ngakak' },
  { target: 'shorts stand up comedy lucu viral indonesia', label: 'Komedi Lucu' },

  // 3. Gaming & Streamer Moments
  { target: 'shorts gaming epic moments streamer seru viral', label: 'Gaming Viral' },
  { target: 'shorts mobile legends free fire seru kocak', label: 'Gaming Indo' },

  // 4. Kuliner & Food Street
  { target: 'shorts review makanan viral street food enak asmr', label: 'Kuliner Viral' },
  { target: 'shorts jajanan kaki lima viral bikin ngiler', label: 'Street Food' },

  // 5. Tech & Gadget Unik
  { target: 'shorts gadget canggih teknologi unik inovasi terbaru', label: 'Gadget Unik' },
  { target: 'shorts tips trik hp rahasia teknologi seru', label: 'Tech Innovation' },

  // 6. Music & Sounds Viral TikTok
  { target: 'shorts lagu hits viral tiktok sound terbaru 2026', label: 'Musik Viral' },
  { target: 'shorts jedag jedug dj viral tiktok', label: 'Sound FYP' },

  // 7. Fakta Unik & Populer
  { target: 'shorts fakta menarik dunia terpopuler unik bikin kaget', label: 'Fakta Menarik' },
  { target: 'shorts momen heboh viral media sosial', label: 'Momen Heboh' },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qParam = searchParams.get('q');

  let targetSources: { target: string; label: string }[] = [];

  if (qParam && qParam.trim()) {
    targetSources = [{ target: qParam.trim(), label: 'Search Results' }];
  } else {
    // Pick 4-5 random topics across distinct genres for diverse TikTok-like FYP feed
    const shuffled = [...LIVE_SHORTS_TOPIC_POOLS].sort(() => 0.5 - Math.random());
    targetSources = shuffled.slice(0, 5);
  }

  const allShorts: any[] = [];
  const seenIds = new Set<string>();

  // Fetch topics in parallel using high-speed InnerTube API
  try {
    const topicPromises = targetSources.map(async (src) => {
      // 1. Tier 1: InnerTube search
      try {
        const innerResults = await searchShortsViaInnerTube(src.target, 15);
        if (innerResults && innerResults.length > 0) {
          return innerResults;
        }
      } catch {}

      // 2. Tier 1.5: General search via InnerTube
      try {
        const queryTerm = src.target.includes('short') ? src.target : `${src.target} #shorts`;
        const genResults = await searchViaInnerTube(queryTerm, 15, 'Shorts');
        if (genResults && genResults.length > 0) {
          return genResults.map((v) => ({
            ...v,
            id: v.id.startsWith('short-yt-') ? v.id : `short-${v.id}`,
            category: 'Shorts',
            duration: v.duration || '0:50',
          }));
        }
      } catch {}

      // 3. Tier 2: youtube-sr fallback
      try {
        const queryTerm = src.target.includes('short') ? src.target : `${src.target} #shorts`;
        const srResults = await YouTube.search(queryTerm, {
          limit: 12,
          type: 'video',
        });

        if (srResults && srResults.length > 0) {
          return srResults
            .filter((item: any) => item && item.id && item.title)
            .map((item: any) => {
              const videoId = item.id;
              const views = typeof item.views === 'number' ? item.views : 650000;
              const likes = Math.floor(views * 0.08) || 35000;
              const channelName = item.channel?.name || 'Trending Creator';
              return {
                id: `short-yt-${videoId}`,
                youtubeId: videoId,
                title: item.title,
                description: item.description || `Trending Short: ${item.title}`,
                channelTitle: channelName,
                channelId: item.channel?.id || `c-${videoId}`,
                channelAvatar:
                  item.channel?.icon?.url ||
                  `https://picsum.photos/seed/${encodeURIComponent(channelName)}/100/100`,
                subscriberCount: item.channel?.subscribers ? item.channel.subscribers.replace(/subscribers?/i, '').trim() : '500K+',
                verified: Boolean(item.channel?.verified),
                thumbnailUrl:
                  item.thumbnail?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                views,
                likes,
                dislikes: 15,
                uploadedAt: item.uploadedAt || 'Trending Baru',
                duration: item.durationFormatted || '0:50',
                category: 'Shorts',
                tags: ['Shorts', 'Viral', 'Trending', 'FYP'],
                commentsCount: Math.floor(views * 0.003) || 750,
              };
            });
        }
      } catch {}

      return [];
    });

    const resultsByTopic = await Promise.all(topicPromises);

    // Interleave topic results for diverse TikTok-like FYP experience
    let maxLen = 0;
    for (const list of resultsByTopic) {
      if (list.length > maxLen) maxLen = list.length;
    }

    for (let i = 0; i < maxLen; i++) {
      for (const topicList of resultsByTopic) {
        if (topicList[i]) {
          const item = topicList[i];
          const cleanId = item.youtubeId || item.id.replace('short-yt-', '').replace('yt-', '');
          if (!seenIds.has(cleanId) && cleanId.length === 11) {
            seenIds.add(cleanId);
            allShorts.push(item);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Shorts route error:', err);
  }

  // If results are low, append INITIAL_SHORTS as safe fallback
  if (allShorts.length < 5) {
    for (const item of INITIAL_SHORTS) {
      const cleanId = item.youtubeId || item.id.replace('short-yt-', '');
      if (!seenIds.has(cleanId)) {
        seenIds.add(cleanId);
        allShorts.push(item);
      }
    }
  }

  return NextResponse.json(
    {
      results: allShorts,
      count: allShorts.length,
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=86400',
      },
    }
  );
}
