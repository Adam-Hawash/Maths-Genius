import Image from "next/image";
import { ArrowRight, GraduationCap, Languages, Star } from "lucide-react";
import { LettersBackground } from "./LettersBackground";

export function Hero() {
  return (
    <section
      id="home"
      className="hero-dark relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      {/* Generated glow backdrop — very low opacity */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero-glow.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#12101F]/70 via-[#1E1B2E]/55 to-[#12101F]" />
        {/* soft brand orbs */}
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#7C3AED]/25 blur-[110px]" />
        <div className="absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-[#F59E0B]/15 blur-[110px]" />
      </div>

      <LettersBackground />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <div className="fade-up fu-1 mb-6 inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-4 py-1.5 text-sm font-bold text-[#FBBF24]">
            <Star className="h-4 w-4 fill-[#FBBF24]" aria-hidden="true" />
            English Made Easy
          </div>

          <h1 className="fade-up fu-2 font-display text-5xl font-bold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-[4.2rem]">
            Mr. Islam{" "}
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C4B5FD] to-[#FBBF24] bg-clip-text text-transparent">
              Mohamed
            </span>
          </h1>

          <p className="fade-up fu-3 mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70 lg:mx-0">
            Your journey to confident English starts here. Clear lessons, focused
            practice, and a teacher who makes every rule finally make sense — for
            Grade 7 all the way to High School.
          </p>

          <div className="fade-up fu-4 mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
            <a
              href="#grades"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-7 text-sm font-bold text-white shadow-[0_14px_34px_-12px_rgba(124,58,237,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#6D28D9] sm:w-auto"
            >
              Explore the Platform
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#about"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 text-sm font-bold text-white backdrop-blur transition-colors hover:border-white/50 hover:bg-white/10 sm:w-auto"
            >
              Meet Mr. Islam
            </a>
          </div>

          {/* Light stats row */}
          <dl className="fade-up fu-5 mx-auto mt-10 flex max-w-md items-center justify-center gap-6 sm:justify-start lg:mx-0">
            {[
              { icon: GraduationCap, k: "4", v: "Grade levels" },
              { icon: Languages, k: "6", v: "Core skills" },
              { icon: Star, k: "100%", v: "Dedication" },
            ].map(({ icon: Icon, k, v }) => (
              <div key={v} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[#C4B5FD]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-display text-lg font-bold text-white">{k}</span>
                  <span className="text-xs text-white/55">{v}</span>
                </span>
              </div>
            ))}
          </dl>
        </div>

        {/* Teacher portrait */}
        <div className="fade-up fu-3 relative mx-auto w-full max-w-sm lg:max-w-md">
          <div className="soft-float relative">
            <div
              className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-[#7C3AED]/40 via-transparent to-[#F59E0B]/30 blur-xl"
              aria-hidden="true"
            />
            <figure className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.65)] ring-1 ring-white/10 backdrop-blur">
              <Image
                src="/images/teacher-frame.jpg"
                alt="Mr. Islam Mohamed — English teacher"
                width={864}
                height={1152}
                priority
                className="h-auto w-full object-cover"
                sizes="(max-width: 1024px) 90vw, 420px"
              />
              <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#12101F]/70 px-4 py-3 backdrop-blur-md">
                <span className="flex flex-col leading-tight">
                  <span className="font-display text-sm font-bold text-white">
                    Mr. Islam — English Teacher
                  </span>
                  <span className="text-xs text-[#FBBF24]">English Made Easy</span>
                </span>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] font-display text-xs font-bold text-white"
                  aria-hidden="true"
                >
                  MI
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
