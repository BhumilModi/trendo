import { allowedImage } from "./images.ts";
import { CATEGORIES, type StoryInput } from "./types.ts";

type Candidate = { title: string; url: string; source: string };

const FEEDS = [
  { source: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { source: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { source: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
];
const HN = "https://hacker-news.firebaseio.com/v0";
// gemini-3.5-flash is deprecated upstream and auto-routed to 3.6. When a model is
// overloaded (503) we move down the list instead of failing the day.
const MODELS = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"];

const getJson = async (url: string) => (await fetch(url, { signal: AbortSignal.timeout(10_000) })).json();

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

// Handles RSS <item><link>url</link> and Atom <entry><link href="url"/>.
export function parseFeed(xml: string, source: string): Candidate[] {
  return [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/g)].flatMap(([block]) => {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
    const url =
      block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1] ??
      block.match(/<link[^>]*href="([^"]+)"/)?.[1] ??
      block.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    return title && url ? [{ title: decode(title), url: decode(url), source }] : [];
  });
}

async function fetchHN(): Promise<Candidate[]> {
  const ids: number[] = (await getJson(`${HN}/topstories.json`)).slice(0, 60);
  const items = await Promise.all(ids.map((id) => getJson(`${HN}/item/${id}.json`).catch(() => null)));
  return items
    .filter((i) => i?.url && i.score >= 100)
    .slice(0, 30)
    .map((i) => ({ title: i.title, url: i.url, source: "Hacker News" }));
}

async function fetchCandidates(): Promise<Candidate[]> {
  const results = await Promise.allSettled([
    fetchHN(),
    ...FEEDS.map(async (f) => {
      const res = await fetch(f.url, { signal: AbortSignal.timeout(10_000), headers: { "user-agent": "Mozilla/5.0 Trendo" } });
      return parseFeed(await res.text(), f.source).slice(0, 20);
    }),
  ]);
  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return [...new Map(all.map((c) => [c.url, c])).values()];
}

export function validateStories(stories: unknown, allowedUrls?: Iterable<string>): StoryInput[] {
  if (!Array.isArray(stories) || stories.length !== 5) throw new Error(`Expected 5 stories, got ${Array.isArray(stories) ? stories.length : typeof stories}`);
  const allowed = allowedUrls && new Set(allowedUrls);
  const companies = new Set<string>();
  stories.forEach((s: StoryInput, i) => {
    const fail = (msg: string) => {
      throw new Error(`Story ${i + 1}: ${msg}`);
    };
    for (const k of ["headline", "what", "why", "sourceUrl", "sourceName", "company", "question"] as const)
      if (typeof s?.[k] !== "string" || !s[k].trim()) fail(`missing ${k}`);
    if (s.headline.length > 70) fail("headline over 70 chars");
    if (!CATEGORIES.includes(s.category)) fail(`bad category "${s.category}"`);
    if (!Array.isArray(s.options) || s.options.length !== 3 || s.options.some((o) => typeof o !== "string" || !o.trim())) fail("need exactly 3 options");
    if (!Number.isInteger(s.answerIndex) || s.answerIndex < 0 || s.answerIndex > 2) fail("answerIndex must be 0-2");
    if (!/^https?:\/\//.test(s.sourceUrl)) fail("sourceUrl must be http(s)"); // it becomes a link href
    if (allowed && !allowed.has(s.sourceUrl)) fail(`sourceUrl not a candidate: ${s.sourceUrl}`);
    const key = s.company.trim().toLowerCase();
    if (companies.has(key)) fail(`duplicate company "${s.company}"`);
    companies.add(key);
  });
  return stories;
}

const str = { type: "string" };
const SCHEMA = {
  type: "array",
  minItems: 5,
  maxItems: 5,
  items: {
    type: "object",
    properties: {
      headline: str,
      what: str,
      why: str,
      category: { type: "string", enum: CATEGORIES },
      sourceUrl: str,
      sourceName: str,
      company: str,
      question: str,
      options: { type: "array", items: str, minItems: 3, maxItems: 3 },
      answerIndex: { type: "integer", minimum: 0, maximum: 2 },
    },
    required: ["headline", "what", "why", "category", "sourceUrl", "sourceName", "company", "question", "options", "answerIndex"],
  },
};

const PROMPT = `You are the editor of Trendo, a daily app with 5 important tech stories.
From the candidate stories below, pick the 5 most important for a general tech-curious reader. Mix categories (${CATEGORIES.join(", ")}); avoid two stories on the same topic.
Write for readers who have English as a second language: short sentences, simple words, no idioms or slang. If you must use a technical word, explain it in a few words.
For each story:
- headline: at most 70 characters.
- what: what happened, at most 3 short sentences.
- why: why it matters, 1 sentence.
- category: one of ${CATEGORIES.join(", ")}.
- sourceUrl: copy the candidate URL exactly. sourceName: the publication or site name.
- company: the one company or product the story is about. All 5 must be different.
- question: one factual question that the "what" or "why" text answers. options: exactly 3 short answers, one correct. answerIndex: 0, 1 or 2 for the correct option.
Use only facts from the candidate titles and widely known context. Do not invent numbers or quotes.

Candidates:
`;

export async function generateStories(): Promise<StoryInput[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const candidates = await fetchCandidates();
  if (candidates.length < 5) throw new Error(`Only ${candidates.length} candidate stories fetched`);

  const list = candidates.map((c) => `- [${c.source}] ${c.title} | ${c.url}`).join("\n");
  const stories = validateStories(JSON.parse(await callGemini(key, PROMPT + list)), candidates.map((c) => c.url));
  const images = await Promise.all(stories.map((st) => previewImage(st.sourceUrl)));
  return stories.map((st, i) => ({ ...st, imageUrl: images[i] }));
}

/** Gemini returns 503 when overloaded and 429 when rate limited: retry once, then try the next model. */
async function callGemini(key: string, text: string): Promise<string> {
  let last = "";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: { responseMimeType: "application/json", responseJsonSchema: SCHEMA },
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429 || res.status >= 500) {
        last = `${model} ${res.status}`;
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      if (!res.ok) throw new Error(`Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const out = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text;
      if (!out) throw new Error(`Gemini ${model} returned no content`);
      return out;
    }
  }
  throw new Error(`Gemini unavailable (${last})`);
}

/** The article's og:image, if it's on an allowed host. Never fails the day. */
export async function previewImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "user-agent": "Mozilla/5.0 Trendo" } });
    const html = (await res.text()).slice(0, 300_000);
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image/i);
    return allowedImage(m?.[1]?.replace(/&amp;/g, "&"));
  } catch {
    return null;
  }
}
