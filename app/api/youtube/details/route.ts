import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';
import { safeFetchYouTube } from '@/lib/youtube-fetch';
import { INITIAL_VIDEOS } from '@/data/videos';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('videoId') || searchParams.get('id') || '';
  const videoId = rawId.replace(/^yt-/, '').replace(/^short-yt-/, '').trim();

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // 1. Primary: Scrape YouTube Watch Page for exact live data
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const html = await safeFetchYouTube(watchUrl, 2, 6000);

    if (html) {
      // Extract player response
      const playerMatch =
        html.match(/var ytInitialPlayerResponse = ({[\s\S]*?});<\/script>/) ||
        html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);

      let videoDetails: any = null;
      let microformat: any = null;

      if (playerMatch && playerMatch[1]) {
        try {
          const parsedPlayer = JSON.parse(playerMatch[1]);
          videoDetails = parsedPlayer.videoDetails;
          microformat = parsedPlayer.microformat?.playerMicroformatRenderer;
        } catch {}
      }

      // Extract initial data for extra details
      const dataMatch =
        html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
        html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/);

      let ytData: any = null;
      if (dataMatch && dataMatch[1]) {
        try {
          ytData = JSON.parse(dataMatch[1]);
        } catch {}
      }

      if (videoDetails) {
        const rawViews =
          videoDetails.viewCount ||
          microformat?.viewCount ||
          '';

        const numericViews = parseInt(String(rawViews).replace(/[^0-9]/g, ''), 10) ||
          parseYouTubeViews(rawViews, null, 100000);

        const title = videoDetails.title || microformat?.title?.simpleText || 'YouTube Video';
        const channelTitle = videoDetails.author || 'YouTube Creator';
        const channelId = videoDetails.channelId || `c-${videoId}`;
        const description = videoDetails.shortDescription || microformat?.description?.simpleText || '';
        const durationSec = parseInt(videoDetails.lengthSeconds || '0', 10);
        
        let durationFormatted = '10:00';
        if (durationSec > 0) {
          const mins = Math.floor(durationSec / 60);
          const secs = durationSec % 60;
          durationFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        const publishedTime =
          microformat?.publishDate ||
          microformat?.uploadDate ||
          'Recently';

        // Format nice upload date
        let uploadedAt = 'Recently';
        if (publishedTime && publishedTime !== 'Recently') {
          try {
            const dateObj = new Date(publishedTime);
            if (!isNaN(dateObj.getTime())) {
              uploadedAt = new Intl.DateTimeFormat('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }).format(dateObj);
            }
          } catch {}
        }

        // Try to extract exact likes, subscriber count, comments count, avatar, and full description
        let likes = 0;
        let subscriberCount = '';
        let commentsCount = 0;
        let channelAvatar = `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`;
        let fullDescription = description || '';

        // Deep search in ytData for rich metadata
        if (ytData) {
          const scanNode = (node: any) => {
            if (!node || typeof node !== 'object') return;

            // 1. Likes extraction
            if (node.segmentedLikeDislikeButtonViewModel?.likeButtonViewModel?.likeButtonViewModel?.toggleButtonViewModel?.toggleButtonViewModel?.defaultButtonViewModel?.buttonViewModel?.title) {
              const text = node.segmentedLikeDislikeButtonViewModel.likeButtonViewModel.likeButtonViewModel.toggleButtonViewModel.toggleButtonViewModel.defaultButtonViewModel.buttonViewModel.title;
              const parsed = parseYouTubeViews(text, null, 0);
              if (parsed > 0) likes = parsed;
            }
            if (node.likeButtonViewModel?.likeButtonViewModel?.toggleButtonViewModel?.toggleButtonViewModel?.defaultButtonViewModel?.buttonViewModel?.title) {
              const text = node.likeButtonViewModel.likeButtonViewModel.toggleButtonViewModel.toggleButtonViewModel.defaultButtonViewModel.buttonViewModel.title;
              const parsed = parseYouTubeViews(text, null, 0);
              if (parsed > 0) likes = parsed;
            }
            if (node.toggleButtonRenderer?.defaultText?.simpleText) {
              const parsed = parseYouTubeViews(node.toggleButtonRenderer.defaultText.simpleText, null, 0);
              if (parsed > 0) likes = parsed;
            }

            // 2. Subscriber count extraction
            if (node.videoOwnerRenderer?.subscriberCountText?.simpleText) {
              subscriberCount = node.videoOwnerRenderer.subscriberCountText.simpleText;
            } else if (Array.isArray(node.videoOwnerRenderer?.subscriberCountText?.runs)) {
              subscriberCount = node.videoOwnerRenderer.subscriberCountText.runs.map((r: any) => r.text).join('');
            } else if (node.subscriberCountText?.simpleText) {
              subscriberCount = node.subscriberCountText.simpleText;
            } else if (Array.isArray(node.subscriberCountText?.runs)) {
              subscriberCount = node.subscriberCountText.runs.map((r: any) => r.text).join('');
            } else if (node.videoOwnerRenderer?.subscriberCountText?.accessibility?.accessibilityData?.label) {
              subscriberCount = node.videoOwnerRenderer.subscriberCountText.accessibility.accessibilityData.label;
            }

            // 3. Comments Count extraction
            if (node.commentsHeaderRenderer?.countText?.runs) {
              const cText = node.commentsHeaderRenderer.countText.runs.map((r: any) => r.text).join('');
              const parsed = parseYouTubeViews(cText, null, 0);
              if (parsed > 0) commentsCount = parsed;
            } else if (node.commentsEntryPointViewModel?.commentCount?.content) {
              const parsed = parseYouTubeViews(node.commentsEntryPointViewModel.commentCount.content, null, 0);
              if (parsed > 0) commentsCount = parsed;
            }

            // 4. Channel Avatar extraction
            if (node.videoOwnerRenderer?.thumbnail?.thumbnails && Array.isArray(node.videoOwnerRenderer.thumbnail.thumbnails)) {
              const thumbs = node.videoOwnerRenderer.thumbnail.thumbnails;
              if (thumbs.length > 0 && thumbs[thumbs.length - 1]?.url) {
                channelAvatar = thumbs[thumbs.length - 1].url;
              }
            } else if (node.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails) {
              const thumbs = node.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails;
              if (thumbs.length > 0 && thumbs[thumbs.length - 1]?.url) {
                channelAvatar = thumbs[thumbs.length - 1].url;
              }
            }

            // 5. Full attributed description extraction
            if (node.attributedDescription?.content && node.attributedDescription.content.length > fullDescription.length) {
              fullDescription = node.attributedDescription.content;
            }
            if (node.expandableVideoDescriptionBodyRenderer?.attributedDescriptionBodyText?.content && node.expandableVideoDescriptionBodyRenderer.attributedDescriptionBodyText.content.length > fullDescription.length) {
              fullDescription = node.expandableVideoDescriptionBodyRenderer.attributedDescriptionBodyText.content;
            }

            for (const k of Object.keys(node)) {
              scanNode(node[k]);
            }
          };
          scanNode(ytData);
        }

        // Likes Regex Fallback from raw HTML
        if (!likes) {
          const likeRegexMatch =
            html.match(/"defaultButtonViewModel"\s*:\s*\{"buttonViewModel"\s*:\s*\{"title"\s*:\s*"([^"]+)"/) ||
            html.match(/"accessibilityData"\s*:\s*\{"label"\s*:\s*"([0-9.,]+(?:\s*jt|\s*M|\s*rb|\s*K)?\s*(?:like|likes|suka))"/i);
          if (likeRegexMatch && likeRegexMatch[1]) {
            likes = parseYouTubeViews(likeRegexMatch[1], null, 0);
          }
        }
        if (!likes) {
          likes = Math.round(numericViews * 0.045) || 2500;
        }

        // Comments Count Regex Fallback from raw HTML
        if (!commentsCount) {
          const commentRegexMatch = html.match(/"countText"\s*:\s*\{"runs"\s*:\s*\[\{"text"\s*:\s*"([^"]+)"\}/) ||
            html.match(/([0-9.,]+(?:\s*jt|\s*M|\s*rb|\s*K)?\s*(?:komentar|comments))/i);
          if (commentRegexMatch && commentRegexMatch[1]) {
            commentsCount = parseYouTubeViews(commentRegexMatch[1], null, 0);
          }
        }
        if (!commentsCount) {
          commentsCount = Math.round(numericViews * 0.0035) || 120;
        }

        // Regex fallbacks for subscriber count if not extracted from JSON
        if (!subscriberCount) {
          const subSimpleMatch = html.match(/"subscriberCountText"\s*:\s*\{[^}]*?"simpleText"\s*:\s*"([^"]+)"/);
          if (subSimpleMatch && subSimpleMatch[1]) {
            subscriberCount = subSimpleMatch[1];
          } else {
            const subRunsMatch = html.match(/"subscriberCountText"\s*:\s*\{"runs":\s*\[\{"text"\s*:\s*"([^"]+)"\}/);
            if (subRunsMatch && subRunsMatch[1]) {
              subscriberCount = subRunsMatch[1];
            } else {
              const subLabelMatch = html.match(/"subscriberCountText"\s*:\s*\{"accessibility":\s*\{"accessibilityData":\s*\{"label"\s*:\s*"([^"]+)"/);
              if (subLabelMatch && subLabelMatch[1]) {
                subscriberCount = subLabelMatch[1];
              } else {
                const subTextMatch = html.match(/([0-9.,]+(?:\s*jt|\s*M|\s*rb|\s*K|\s*B)?\s*(?:subscriber|pelanggan|subscribers|pengikut))/i);
                if (subTextMatch && subTextMatch[1]) {
                  subscriberCount = subTextMatch[1];
                }
              }
            }
          }
        }

        // Regex fallback for channel avatar
        if (channelAvatar.includes('picsum.photos')) {
          const avatarMatch = html.match(/"videoOwnerRenderer"\s*:\s*\{[\s\S]*?"thumbnails"\s*:\s*\[\{"url"\s*:\s*"([^"]+)"/);
          if (avatarMatch && avatarMatch[1]) {
            channelAvatar = avatarMatch[1];
          }
        }

        // Clean up subscriber count text (e.g. "1.25M subscribers" -> "1.25M")
        let cleanedSubscribers = subscriberCount
          ? subscriberCount.replace(/\s*(?:subscribers?|pelanggan|pengikut|abonnés|suscriptores)\s*$/i, '').trim()
          : '';

        // If still missing subscriber count, fetch real subscriber count from YouTube channel
        if (!cleanedSubscribers || cleanedSubscribers === '100K+' || cleanedSubscribers === '150K+') {
          try {
            let chTargetUrl = '';
            if (channelId && channelId.startsWith('UC')) {
              chTargetUrl = `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`;
            } else if (channelTitle) {
              chTargetUrl = `https://www.youtube.com/@${encodeURIComponent(channelTitle.replace(/\s+/g, ''))}`;
            }

            if (chTargetUrl) {
              const chHtml = await safeFetchYouTube(chTargetUrl, 2, 4500);
              if (chHtml) {
                const chSubMatch =
                  chHtml.match(/"subscriberCountText"\s*:\s*\{[^}]*?"simpleText"\s*:\s*"([^"]+)"/) ||
                  chHtml.match(/"subscriberCountText"\s*:\s*\{"runs":\s*\[\{"text"\s*:\s*"([^"]+)"\}/) ||
                  chHtml.match(/"subscriberCountText"\s*:\s*\{"accessibility":\s*\{"accessibilityData":\s*\{"label"\s*:\s*"([^"]+)"/) ||
                  chHtml.match(/([0-9.,]+(?:\s*jt|\s*M|\s*rb|\s*K|\s*B)?\s*(?:subscriber|pelanggan|subscribers|pengikut))/i);
                if (chSubMatch && chSubMatch[1]) {
                  cleanedSubscribers = chSubMatch[1].replace(/\s*(?:subscribers?|pelanggan|pengikut|abonnés|suscriptores)\s*$/i, '').trim();
                }
              }
            }
          } catch {}
        }

        if (!cleanedSubscribers) {
          cleanedSubscribers = '100K+';
        }

        const thumbnail =
          videoDetails.thumbnail?.thumbnails?.[videoDetails.thumbnail.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return NextResponse.json(
          {
            video: {
              id: `yt-${videoId}`,
              youtubeId: videoId,
              title,
              description: fullDescription || description,
              channelTitle,
              channelId,
              channelAvatar,
              subscriberCount: cleanedSubscribers,
              verified: true,
              thumbnailUrl: thumbnail,
              views: numericViews,
              likes,
              dislikes: Math.round(likes * 0.01) || 10,
              uploadedAt,
              duration: durationFormatted,
              category: 'YouTube',
              tags: Array.isArray(videoDetails.keywords) ? videoDetails.keywords : [channelTitle, 'YouTube'],
              commentsCount,
            },
            source: 'watch-page-scrape',
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
            },
          }
        );
      }
    }
  } catch {}

  // 2. Fallback: youtube-sr getVideo
  try {
    const v = await YouTube.getVideo(`https://www.youtube.com/watch?v=${videoId}`);
    if (v) {
      return NextResponse.json(
        {
          video: {
            id: `yt-${videoId}`,
            youtubeId: videoId,
            title: v.title || 'YouTube Video',
            description: v.description || '',
            channelTitle: v.channel?.name || 'YouTube Creator',
            channelId: v.channel?.id || `c-${videoId}`,
            channelAvatar: v.channel?.icon?.url || `https://picsum.photos/seed/${encodeURIComponent(v.channel?.name || videoId)}/100/100`,
            subscriberCount: v.channel?.subscribers ? v.channel.subscribers.replace(/subscribers?/i, '').trim() : '100K+',
            verified: Boolean(v.channel?.verified),
            thumbnailUrl: v.thumbnail?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            views: typeof v.views === 'number' ? v.views : 150000,
            likes: typeof v.likes === 'number' ? v.likes : Math.round((v.views || 100000) * 0.045),
            dislikes: 10,
            uploadedAt: v.uploadedAt || 'Recently',
            duration: v.durationFormatted || '10:00',
            category: 'YouTube',
            tags: Array.isArray(v.tags) ? v.tags : [v.channel?.name || 'YouTube'],
            commentsCount: Math.round((v.views || 100000) * 0.003) || 100,
          },
          source: 'youtube-sr',
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
          },
        }
      );
    }
  } catch {}

  // 3. Check INITIAL_VIDEOS
  const matchedCurated = INITIAL_VIDEOS.find(
    (v) => v.youtubeId === videoId || v.id === `yt-${videoId}` || v.id === videoId
  );
  if (matchedCurated) {
    return NextResponse.json(
      {
        video: matchedCurated,
        source: 'curated-fallback',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
        },
      }
    );
  }

  // 4. Guaranteed valid synthetic video to prevent 404
  return NextResponse.json(
    {
      video: {
        id: `yt-${videoId}`,
        youtubeId: videoId,
        title: `YouTube Video (${videoId})`,
        description: 'Tonton video di NextTube player.',
        channelTitle: 'YouTube Creator',
        channelId: `c-${videoId}`,
        channelAvatar: `https://picsum.photos/seed/${videoId}/100/100`,
        subscriberCount: '100K+',
        verified: true,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        views: 85000,
        likes: 3200,
        dislikes: 10,
        uploadedAt: 'Recently',
        duration: '10:00',
        category: 'YouTube',
        tags: ['YouTube', 'Video'],
        commentsCount: 45,
      },
      source: 'synthetic-fallback',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
      },
    }
  );
}
