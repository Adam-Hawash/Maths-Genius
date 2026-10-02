import { BookOpenText, Headphones, LibraryBig, PenLine } from "lucide-react";
import { Reveal } from "./Reveal";

const FEATURES = [
  {
    icon: BookOpenText,
    title: "Simplified Grammar",
    text: "Clear, step-by-step explanations that turn confusing English rules into ideas you actually remember.",
    tone: "violet" as const,
  },
  {
    icon: LibraryBig,
    title: "Vocabulary Building",
    text: "Themed word sets and steady revision that grow your vocabulary naturally, lesson after lesson.",
    tone: "amber" as const,
  },
  {
    icon: Headphones,
    title: "Listening & Speaking",
    text: "Audio practice and guided conversation that train your ear and build real speaking confidence.",
    tone: "amber" as const,
  },
  {
    icon: PenLine,
    title: "Reading & Writing",
    text: "Levelled passages and model answers that sharpen comprehension and teach you to write like a pro.",
    tone: "violet" as const,
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-[#7C3AED]">
            Why learn with us
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to excel
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Six core English skills, one clear path. Every lesson is built to be
            simple, focused, and genuinely useful inside and outside the classroom.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <article className="card-soft group h-full p-6">
                <span
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${
                    f.tone === "violet"
                      ? "bg-[#7C3AED]/10 text-[#7C3AED] ring-[#7C3AED]/25"
                      : "bg-[#F59E0B]/10 text-[#D97706] ring-[#F59E0B]/30"
                  }`}
                >
                  <f.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
