import Image from "next/image";
import { BadgeCheck, Quote, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";

const TRAITS = [
  "Patient & friendly",
  "Exam-focused",
  "Interactive lessons",
  "Clear explanations",
];

export function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Portrait */}
        <Reveal className="order-2 mx-auto w-full max-w-sm lg:order-1 lg:max-w-md">
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-tr from-[#F59E0B]/25 via-transparent to-[#7C3AED]/25 blur-xl"
              aria-hidden="true"
            />
            <figure className="card-soft relative overflow-hidden !rounded-[1.5rem] p-2">
              <Image
                src="/images/teacher-frame.jpg"
                alt="Mr. Islam Mohamed in class"
                width={864}
                height={1152}
                className="h-auto w-full rounded-[1.15rem] object-cover"
                sizes="(max-width: 1024px) 90vw, 420px"
              />
              <figcaption className="mt-3 flex items-center justify-center gap-2 pb-1 text-sm font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
                Mr. Islam — English Teacher
              </figcaption>
            </figure>
          </div>
        </Reveal>

        {/* Copy */}
        <Reveal delay={120} className="order-1 lg:order-2">
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-[#7C3AED]">
            About the teacher
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Meet Mr. Islam Mohamed
          </h2>
          <div className="relative mt-6">
            <Quote
              className="absolute -left-2 -top-3 h-8 w-8 text-[#7C3AED]/15"
              aria-hidden="true"
            />
            <p className="text-base leading-relaxed text-muted-foreground">
              I believe English should feel simple, not scary. On this platform,
              every lesson is broken down into clear steps — from the first grammar
              rule to full exam readiness — so students build real confidence,
              not just memorised answers.
            </p>
          </div>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            With focused practice across reading, writing, listening, and
            speaking, my goal is simple: make English easy — and even enjoyable —
            for every student who joins me.
          </p>

          <ul className="mt-7 flex flex-wrap gap-2.5">
            {TRAITS.map((t) => (
              <li
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold text-foreground/80 shadow-[0_1px_2px_rgba(18,16,31,0.05)]"
              >
                <BadgeCheck className="h-4 w-4 text-[#7C3AED]" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>

          <a
            href="#grades"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#7C3AED] px-6 text-sm font-bold text-white shadow-[0_10px_26px_-10px_rgba(124,58,237,0.65)] transition-all hover:-translate-y-0.5 hover:bg-[#6D28D9]"
          >
            View the classes
          </a>
        </Reveal>
      </div>
    </section>
  );
}
