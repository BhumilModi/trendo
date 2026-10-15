import Image from "next/image";
import { TopicArt } from "./art";

/** The article's photo, printed onto the paper; the topic plate when there isn't one. */
export function StoryPhoto({ src, category, alt, priority }: { src: string | null; category: string; alt: string; priority?: boolean }) {
  return (
    <figure className="photo">
      {src ? (
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 560px" quality={60} priority={priority} />
      ) : (
        <TopicArt category={category} />
      )}
    </figure>
  );
}

export function StoryThumb({ src, category }: { src: string | null; category: string }) {
  return (
    <span className="thumb" aria-hidden>
      {src ? <Image src={src} alt="" fill sizes="64px" quality={55} /> : <TopicArt category={category} small />}
    </span>
  );
}
