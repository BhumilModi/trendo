export const CATEGORIES = [
  "AI",
  "Devices",
  "Dev & Open Source",
  "Security",
  "Business & Startups",
] as const;

export type Category = (typeof CATEGORIES)[number];

// One story card as produced by the generator or the fallback file.
export type StoryInput = {
  headline: string;
  what: string; // what happened, max ~3 short lines
  why: string; // why it matters, 1 line
  category: Category;
  sourceUrl: string;
  sourceName: string;
  company: string; // company or product the story is about; answer key for the match-up puzzle
  question: string; // used for streak repair
  options: string[]; // 3 options
  answerIndex: number;
  imageUrl?: string | null; // article preview image, only from IMAGE_HOSTS
};
