/**
 * Randomized User-Agent strings for Frontier booking requests.
 *
 * Frontier's booking engine (Navitaire) blocks non-browser User-Agents.
 * We rotate through realistic Chrome/Firefox/Safari strings on common
 * platforms to blend in with normal browser traffic.
 *
 * These mirror the approach used by community tools like GWsearch and
 * the 1491 Club — randomized but realistic browser signatures.
 */

const CHROME_VERSIONS = ['120.0.0.0', '121.0.0.0', '122.0.0.0', '123.0.0.0', '124.0.0.0', '125.0.0.0'];
const FIREFOX_VERSIONS = ['121.0', '122.0', '123.0', '124.0', '125.0'];

const TEMPLATES = [
  // Chrome on Windows
  (cv: string) =>
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv} Safari/537.36`,
  // Chrome on macOS
  (cv: string) =>
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv} Safari/537.36`,
  // Chrome on Linux
  (cv: string) =>
    `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${cv} Safari/537.36`,
  // Firefox on Windows
  (_cv: string, fv: string) =>
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${fv}) Gecko/20100101 Firefox/${fv}`,
  // Firefox on macOS
  (_cv: string, fv: string) =>
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:${fv}) Gecko/20100101 Firefox/${fv}`,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random, realistic browser User-Agent string.
 */
export function randomUserAgent(): string {
  const template = pickRandom(TEMPLATES);
  const chromeVersion = pickRandom(CHROME_VERSIONS);
  const firefoxVersion = pickRandom(FIREFOX_VERSIONS);
  return template(chromeVersion, firefoxVersion);
}

/**
 * Standard request headers that mimic a real browser visiting
 * the Frontier booking site.
 */
export function browserHeaders(): Record<string, string> {
  return {
    'User-Agent': randomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  };
}
