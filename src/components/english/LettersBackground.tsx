/**
 * Subtle floating English letters for the hero backdrop.
 * Pure CSS (no JS animation lib) — a light brush stroke, deliberately quiet.
 */
const LETTERS = [
  { ch: "A", size: "text-[9rem]", top: "12%", left: "4%", tone: "" },
  { ch: "B", size: "text-[6.5rem]", top: "68%", left: "10%", tone: "violet l2" },
  { ch: "C", size: "text-[11rem]", top: "26%", left: "88%", tone: "amber l3" },
  { ch: "e", size: "text-[5rem]", top: "78%", left: "74%", tone: "violet" },
  { ch: "g", size: "text-[7.5rem]", top: "8%", left: "46%", tone: "l4" },
  { ch: "?", size: "text-[4.5rem]", top: "52%", left: "60%", tone: "amber l2" },
];

export function LettersBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {LETTERS.map((l) => (
        <span
          key={l.ch + l.top + l.left}
          className={`float-letter ${l.size} ${l.tone}`.trim()}
          style={{ top: l.top, left: l.left }}
        >
          {l.ch}
        </span>
      ))}
      {/* giant watermark word */}
      <span
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[16vw] font-bold leading-none text-white/[0.025]"
        aria-hidden="true"
      >
        ENGLISH
      </span>
    </div>
  );
}
