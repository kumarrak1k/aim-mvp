/**
 * Submit every sitemap URL to IndexNow (Bing, and via it the indexes that
 * power ChatGPT search and Copilot; also picked up by Yandex and others).
 *
 * Run after deploying meaningful content changes:
 *   node scripts/indexnow.mjs
 *
 * Optionally submit specific URLs only:
 *   node scripts/indexnow.mjs https://aicareermentor.co.uk/blog/new-post
 *
 * The key file lives at public/<KEY>.txt and must stay deployed; IndexNow
 * fetches it to prove domain ownership.
 */

const HOST = "aicareermentor.co.uk";
const KEY = "f85f33f74ac091915000f0603704e94e";
const SITEMAP = `https://${HOST}/sitemap.xml`;

async function getSitemapUrls() {
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const cliUrls = process.argv.slice(2);
  const urlList = cliUrls.length ? cliUrls : await getSitemapUrls();

  console.log(`Submitting ${urlList.length} URL(s) for ${HOST} to IndexNow...`);

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList,
    }),
  });

  // 200 = submitted, 202 = accepted (key validation pending). Both are success.
  if (res.status === 200 || res.status === 202) {
    console.log(`OK (${res.status}) - ${urlList.length} URLs submitted.`);
  } else {
    console.error(`IndexNow returned ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
