import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FAQ } from "@/components/landing/FAQ";

export default function Home() {
  return (
    <main className="flex-grow bg-card">
      <Navbar />
      <div className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <FAQ />
      </div>
      <Footer />
    </main>
  );
}
