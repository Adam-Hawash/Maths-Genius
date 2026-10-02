import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { Features } from "./Features";
import { Grades } from "./Grades";
import { About } from "./About";
import { Footer } from "./Footer";

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <Features />
        <Grades />
        <About />
      </main>
      <Footer />
    </div>
  );
}
