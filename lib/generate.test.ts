import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFeed, validateStories } from "./generate.ts";
import type { StoryInput } from "./types.ts";

const fallback: StoryInput[][] = JSON.parse(readFileSync(new URL("../content/fallback.json", import.meta.url), "utf8"));
const day = () => structuredClone(fallback[0]);

test("parses RSS items and Atom entries", () => {
  const rss = `<rss><channel><title>Feed</title>
    <item><title><![CDATA[Apple &amp; Google ship]]></title><link>https://a.com/1</link></item>
    <item><title>No link</title></item></channel></rss>`;
  assert.deepEqual(parseFeed(rss, "A"), [{ title: "Apple & Google ship", url: "https://a.com/1", source: "A" }]);

  const atom = `<feed><entry><title type="html"><![CDATA[It&#8217;s here]]></title>
    <link rel="alternate" type="text/html" href="https://v.com/2" /></entry></feed>`;
  assert.deepEqual(parseFeed(atom, "V"), [{ title: "It’s here", url: "https://v.com/2", source: "V" }]);
});

test("every fallback day is valid", () => {
  assert.equal(fallback.length, 7);
  for (const d of fallback) validateStories(d);
});

test("validator rejects bad sets", () => {
  assert.throws(() => validateStories(day().slice(0, 4)), /Expected 5/);
  const cases: [(s: StoryInput[]) => void, RegExp][] = [
    [(s) => (s[1].company = s[0].company.toUpperCase()), /duplicate company/],
    [(s) => ((s[0] as { category: string }).category = "Sports"), /bad category/],
    [(s) => s[0].options.pop(), /3 options/],
    [(s) => (s[0].answerIndex = 3), /answerIndex/],
    [(s) => (s[0].headline = "x".repeat(71)), /70 chars/],
    [(s) => (s[0].why = ""), /missing why/],
    [(s) => (s[0].sourceUrl = "javascript:alert(1)"), /http\(s\)/],
  ];
  for (const [mutate, err] of cases) {
    const s = day();
    mutate(s);
    assert.throws(() => validateStories(s), err);
  }
});

test("validator checks sourceUrl against candidates", () => {
  const s = day();
  assert.doesNotThrow(() => validateStories(s, s.map((x) => x.sourceUrl)));
  assert.throws(() => validateStories(s, s.slice(1).map((x) => x.sourceUrl)), /not a candidate/);
});
