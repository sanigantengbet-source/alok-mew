import { Video } from '@/types';
import { parseYouTubeViews } from './youtube-views';

/**
 * High-performance InnerTube API Client for YouTube
 * Uses YouTube's official internal JSON endpoints used by Android / Web apps.
 * Far faster and more resilient against 429 rate limits than raw HTML scraping.
 */

const INNERTUBE_CLIENTS = [
  {
    name: 'ANDROID',
    clientName: 'ANDROID',
    clientVersion: '19.09.37',
    androidSdkVersion: 33,
    userAgent: 'com.google.android.youtube/19.09.37 (Linux; U; Android 13; SM-G998B) gzip',
  },
  {
    name: 'WEB',
    clientName: 'WEB',
    clientVersion: '2.20240401.01.00',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },
  {
    name: 'TV_HTML5_EMBEDDED',
    clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
    clientVersion: '2.0',
    userAgent:
      'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1',
  },
];

interface InnerTubeSearchResult {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  channelAvatar: string;
  subscriberCount: string;
  verified: boolean;
  thumbnailUrl: string;
  views: number;
  likes: number;
  dislikes: number;
  uploadedAt: string;
  duration: string;
  category: string;
  tags: string[];
  commentsCount: number;
}

/**
 * Query YouTube InnerTube API for instant JSON search results
 */
export async function searchViaInnerTube(
  query: string,
  limit = 40,
  category = 'Hasil Pencarian'
): Promise<InnerTubeSearchResult[]> {
  for (const client of INNERTUBE_CLIENTS) {
    try {
      const payload = {
        context: {
          client: {
            hl: 'id',
            gl: 'ID',
            clientName: client.clientName,
            clientVersion: client.clientVersion,
            ...(client.androidSdkVersion ? { androidSdkVersion: client.androidSdkVersion } : {}),
          },
        },
        query,
      };

      const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': client.userAgent,
          'X-YouTube-Client-Name': client.clientName === 'ANDROID' ? '3' : '1',
          'X-YouTube-Client-Version': client.clientVersion,
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4500),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const results: InnerTubeSearchResult[] = [];
      const seenIds = new Set<string>();

      function extractItem(v: any) {
        if (!v || !v.videoId || results.length >= limit) return;
        const videoId = v.videoId;
        if (seenIds.has(videoId)) return;
        seenIds.add(videoId);

        const title =
          v.title?.runs?.[0]?.text ||
          v.title?.simpleText ||
          (Array.isArray(v.title) ? v.title.map((t: any) => t.text).join('') : '');

        if (!title || title.length < 2) return;

        const channelTitle =
          v.ownerText?.runs?.[0]?.text ||
          v.shortBylineText?.runs?.[0]?.text ||
          v.longBylineText?.runs?.[0]?.text ||
          'YouTube Creator';

        const channelId =
          v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
          v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
          `c-${videoId}`;

        const uploadedAt =
          v.publishedTimeText?.simpleText ||
          (Array.isArray(v.publishedTimeText?.runs)
            ? v.publishedTimeText.runs.map((r: any) => r.text).join('')
            : '') ||
          'Baru saja';

        const duration =
          v.lengthText?.simpleText ||
          (Array.isArray(v.lengthText?.runs) ? v.lengthText.runs.map((r: any) => r.text).join('') : '') ||
          '10:00';

        const thumbs = v.thumbnail?.thumbnails || [];
        const thumb =
          thumbs.length > 0
            ? thumbs[thumbs.length - 1]?.url
            : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        const rawViews = v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || '';
        const numericViews = parseYouTubeViews(rawViews, null, 125000);

        results.push({
          id: `yt-${videoId}`,
          youtubeId: videoId,
          title,
          description:
            v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
            `Tonton "${title}" oleh ${channelTitle} di NextTube.`,
          channelTitle,
          channelId,
          channelAvatar:
            v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
            `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`,
          subscriberCount: '500K+',
          verified: Boolean(v.ownerBadges?.length || v.badges?.length),
          thumbnailUrl: thumb,
          views: numericViews,
          likes: Math.round(numericViews * 0.045) || 2500,
          dislikes: 10,
          uploadedAt,
          duration,
          category,
          tags: [channelTitle, category, 'Trending', 'Viral'],
          commentsCount: Math.round(numericViews * 0.003) || 120,
        });
      }

      function walkTree(node: any) {
        if (!node || typeof node !== 'object' || results.length >= limit) return;
        if (node.videoRenderer) {
          extractItem(node.videoRenderer);
        }
        if (node.compactVideoRenderer) {
          extractItem(node.compactVideoRenderer);
        }
        for (const k of Object.keys(node)) {
          walkTree(node[k]);
        }
      }

      walkTree(data);

      if (results.length > 0) {
        return results;
      }
    } catch {
      // Try next client
    }
  }

  return [];
}

/**
 * Public Invidious fallback instances for resilient third-tier lookup
 */
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://invidious.nerdvpn.de',
  'https://vid.puffyan.us',
];

export async function searchViaInvidious(query: string, limit = 30): Promise<InnerTubeSearchResult[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(3500),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; NextTube/2.0)',
        },
      });

      if (!res.ok) continue;
      const list = await res.json();
      if (!Array.isArray(list) || list.length === 0) continue;

      return list.slice(0, limit).map((item: any) => {
        const videoId = item.videoId || item.id;
        const views = typeof item.viewCount === 'number' ? item.viewCount : 150000;
        return {
          id: `yt-${videoId}`,
          youtubeId: videoId,
          title: item.title || 'YouTube Video',
          description: item.description || '',
          channelTitle: item.author || 'YouTube Creator',
          channelId: item.authorId || `c-${videoId}`,
          channelAvatar:
            item.authorThumbnails?.[0]?.url ||
            `https://picsum.photos/seed/${encodeURIComponent(item.author || videoId)}/100/100`,
          subscriberCount: item.authorSubscribers || '500K+',
          verified: Boolean(item.authorVerified),
          thumbnailUrl:
            item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          views,
          likes: typeof item.likeCount === 'number' ? item.likeCount : Math.round(views * 0.04),
          dislikes: 10,
          uploadedAt: item.publishedText || 'Baru saja',
          duration: item.lengthSeconds ? `${Math.floor(item.lengthSeconds / 60)}:${String(item.lengthSeconds % 60).padStart(2, '0')}` : '10:00',
          category: 'Pencarian',
          tags: [item.author || 'YouTube', 'Video'],
          commentsCount: Math.round(views * 0.003) || 80,
        };
      });
    } catch {
      // Try next mirror
    }
  }
  return [];
}
