"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "./Navbar";
import Hero from "./Hero";
import TrustSection from "./TrustSection";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import DashboardPreview from "./DashboardPreview";
import ForceLightMode from "../ForceLightMode";

// Dynamic imports for below-the-fold components
const StatsSection = dynamic(() => import("./StatsSection"), { ssr: true });
const Testimonials = dynamic(() => import("./Testimonials"), { ssr: true });
const Pricing = dynamic(() => import("./Pricing"), { ssr: true });
const CTASection = dynamic(() => import("./CTASection"), { ssr: true });
const Footer = dynamic(() => import("./Footer"), { ssr: true });

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState("0%");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPx = document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = `${(scrollPx / docHeight) * 100}%`;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#0F172A] selection:bg-[#6366f1]/30 selection:text-slate-900 font-sans scroll-smooth leading-relaxed">
      <ForceLightMode />
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-[#6366f1] to-[#3b82f6] z-[9999] transition-all duration-150 ease-out"
        style={{ width: scrollProgress }}
      />

      <Navbar />

      <div className="flex flex-col w-full relative z-0">
        <Hero />
        <TrustSection />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <StatsSection />
        <Testimonials />
        <Pricing />
        <div id="demo">
          <CTASection />
        </div>
      </div>
      <Footer />
    </main>
  );
}
