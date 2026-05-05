"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85",
    alt: "Shoppers browsing clothing in a bright boutique",
    caption: "Curated storefronts · Verified vendors · Secure payments",
  },
  {
    src: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=85",
    alt: "Stacked shopping bags and retail packaging",
    caption: "Multi-vendor cart · One checkout experience",
  },
  {
    src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=85",
    alt: "Customer completing payment at a modern card terminal",
    caption: "Honest reviews · In-app messaging · Stores you can trust",
  },
] as const;

export function HomeHeroSlider() {
  const [index, setIndex] = useState(0);
  const len = SLIDES.length;

  const go = useCallback(
    (n: number) => {
      setIndex(((n % len) + len) % len);
    },
    [len]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % len), 6500);
    return () => window.clearInterval(id);
  }, [len]);

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none animate-fade-in">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-900/10 dark:border-zinc-700 dark:shadow-black/40 sm:aspect-[5/6]"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured marketplace imagery"
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={clsx(
              "absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none",
              i === index ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-6 right-6 z-[1] text-sm font-medium text-white drop-shadow-md">
              {slide.caption}
            </p>
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 justify-between px-2 sm:px-3">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="pointer-events-auto rounded-full border border-white/30 bg-zinc-950/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-zinc-950/60"
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="pointer-events-auto rounded-full border border-white/30 bg-zinc-950/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-zinc-950/60"
          >
            <span className="sr-only">Next</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute bottom-[4.25rem] left-0 right-0 z-20 flex justify-center gap-2 sm:bottom-[4.5rem]">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className={clsx(
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-amber-400 shadow-sm" : "w-2 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      </div>

      <div className="absolute -bottom-6 -left-4 hidden w-44 overflow-hidden rounded-xl border border-zinc-200 shadow-xl dark:border-zinc-700 sm:block">
        <div className="relative aspect-square">
          <Image
            src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80"
            alt="Delivery handoff with shopping bag"
            fill
            className="object-cover"
            sizes="176px"
          />
        </div>
      </div>
    </div>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
