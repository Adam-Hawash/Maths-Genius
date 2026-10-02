import { ArrowRight, Clock } from "lucide-react";
import { Reveal } from "./Reveal";

const GRADES = [
  {
    n: "07",
    name: "Grade 7",
    text: "Build strong foundations in grammar, vocabulary, and everyday English.",
  },
  {
    n: "08",
    name: "Grade 8",
    text: "Level up reading and writing with structured, exam-ready practice.",
  },
  {
    n: "09",
    name: "Grade 9",
    text: "Master the core curriculum and prepare with confidence for exams.",
  },
  {
    n: "HS",
    name: "High School",
    text: "Advanced lessons and intensive training for top final-year results.",
  },
];

export function Grades() {
  return (
    <section id="grades" className="scroll-mt-20 border-y border-border bg-[#F5EFE0] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-[#D97706]">
            Classes
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Find your grade
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Dedicated tracks for every level. Pick your grade — the doors are
            opening soon.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {GRADES.map((g, i) => (
            <Reveal key={g.name} delay={i * 80}>
              <article className="card-soft flex items-center gap-5 p-5 sm:p-6">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] font-display text-xl font-bold text-white shadow-[0_10px_24px_-10px_rgba(124,58,237,0.6)]"
                  aria-hidden="true"
                >
                  {g.n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h3 className="font-display text-lg font-bold text-foreground">{g.name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#B45309]">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{g.text}</p>
                </div>
                <ArrowRight
                  className="hidden h-5 w-5 shrink-0 text-[#7C3AED]/40 transition-transform duration-300 group-hover:translate-x-1 sm:block"
                  aria-hidden="true"
                />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
