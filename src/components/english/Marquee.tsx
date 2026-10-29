const SKILLS = [
  "Grammar",
  "Vocabulary",
  "Reading",
  "Writing",
  "Listening",
  "Speaking",
];

function MarqueeContent() {
  return (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {SKILLS.map((s) => (
        <span key={s} className="flex items-center">
          <span className="px-6 font-display text-sm font-bold uppercase tracking-[0.22em] text-foreground/75 sm:px-8 sm:text-base">
            {s}
          </span>
          <span className="mq-dot text-lg leading-none" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Animated skills strip — cream band that bridges the dark hero and the white canvas.
 * The list is duplicated so the LTR marquee loops seamlessly.
 */
export function Marquee() {
  return (
    <section
      aria-label="English skills covered on the platform"
      className="relative border-y border-border bg-[#F5EFE0] py-4"
    >
      <div className="marquee-mask overflow-hidden">
        <div className="animate-marquee flex w-max">
          <MarqueeContent />
          <MarqueeContent />
        </div>
      </div>
      {/* accessible static list */}
      <ul className="sr-only">
        {SKILLS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  );
}
