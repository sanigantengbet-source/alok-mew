export const YOUTUBE_FETCH_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478; SOCS=CAESEwgDEgk0ODEzNzg5MjQaAmVuIAEaBgiA_LyaBg; PREF=tz=Asia.Jakarta&f6=40000000',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Safely fetches YouTube HTML without throwing unhandled redirect loop errors
 * (e.g. `redirect count exceeded`). Handles redirects manually up to maxRedirects.
 */
export async function safeFetchYouTube(url: string, maxRedirects = 3, timeoutMs = 6000): Promise<string | null> {
  let currentUrl = url;
  let redirects = 0;

  while (redirects <= maxRedirects) {
    try {
      const res = await fetch(currentUrl, {
        headers: YOUTUBE_FETCH_HEADERS,
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      });

      if (res.status >= 200 && res.status < 300) {
        return await res.text();
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) return null;

        // Prevent endless consent loops
        if (location.includes('consent.youtube.com') || location.includes('consent.google.com')) {
          return null;
        }

        currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).toString();
        redirects++;
        continue;
      }

      return null;
    } catch {
      return null;
    }
  }

  return null;
}
