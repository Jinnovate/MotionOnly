const feeds = [
  { category: "US stocks", source: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
  { category: "Stocks", source: "Nasdaq", url: "https://www.nasdaq.com/feed/rssoutbound?category=Stocks" },
  { category: "Forex", source: "DailyFX", url: "https://www.dailyfx.com/feeds/market-news" },
  { category: "Commodities", source: "DailyFX", url: "https://www.dailyfx.com/feeds/commodities" },
];

const fallbackArticles = [
  {
    id: "fallback-risk",
    tag: "RISK",
    source: "Motion Only",
    title: "Market news is unavailable, so use the risk checklist first",
    summary: "If live feeds are unavailable, avoid forcing decisions. Check what changed, whether the move is confirmed, and where the invalidation sits.",
    impact: "Keeps the page useful even when public RSS providers block or rate-limit requests.",
    time: "Fallback brief",
    url: "",
  },
];

const stripTags = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const decode = (value = "") => stripTags(value)
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, "\"")
  .replace(/&#39;/g, "'")
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const getTagValue = (item, tag) => {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decode(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")) : "";
};

const parseFeed = (xml, feed) => {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return items.slice(0, 5).map((item, index) => {
    const title = getTagValue(item, "title");
    const link = getTagValue(item, "link") || (item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ?? "");
    const description = getTagValue(item, "description") || getTagValue(item, "summary") || getTagValue(item, "content");
    const pubDate = getTagValue(item, "pubDate") || getTagValue(item, "updated") || getTagValue(item, "published");
    return {
      id: `${feed.source}-${index}-${title}`.replace(/\W+/g, "-").slice(0, 80),
      tag: feed.category,
      source: feed.source,
      title: title || "Untitled market update",
      summary: description.slice(0, 220) || "Open the original source for the full market context.",
      impact: "Read the source, check the wider market context, and decide whether this changes your watchlist or risk plan.",
      time: pubDate ? new Date(pubDate).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Latest feed",
      url: link,
    };
  });
};

exports.handler = async () => {
  const startedAt = new Date().toISOString();
  const settled = await Promise.allSettled(feeds.map(async (feed) => {
    const response = await fetch(feed.url, {
      headers: {
        "user-agent": "MotionOnlyMarketNews/1.0",
        "accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!response.ok) throw new Error(`${feed.source} returned ${response.status}`);
    const xml = await response.text();
    return parseFeed(xml, feed);
  }));

  const articles = settled
    .flatMap(result => result.status === "fulfilled" ? result.value : [])
    .filter(item => item.title && item.url)
    .slice(0, 18);

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=900, stale-while-revalidate=3600",
      "access-control-allow-origin": "*",
    },
    body: JSON.stringify({
      updatedAt: startedAt,
      sourceMode: articles.length ? "live-public-feeds" : "fallback",
      articles: articles.length ? articles : fallbackArticles,
    }),
  };
};
