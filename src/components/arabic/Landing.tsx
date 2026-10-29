"use client";

import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { ProverbsMarquee } from "./ProverbsMarquee";
import { FeaturesSection } from "./FeaturesSection";
import { AnnouncementsSection } from "./AnnouncementsSection";
import { LessonsSection } from "./LessonsSection";
import { AboutSection } from "./AboutSection";
import { Footer } from "./Footer";
import { LoginModal } from "./LoginModal";

export function Landing({
  loginOpen,
  setLoginOpen,
  onLogin,
  onAdminGate,
}: {
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  onLogin: () => void;
  onAdminGate: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onLogin={onLogin} />
      <main className="flex-1">
        <Hero />
        <ProverbsMarquee />
        <FeaturesSection />
        <AnnouncementsSection />
        <LessonsSection />
        <AboutSection />
      </main>
      <Footer />
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={onAdminGate}
      />
    </div>
  );
}
