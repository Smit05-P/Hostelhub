"use client";

import React from "react";
import { Building2, Home, Hotel, School, Briefcase, LocateIcon, Landmark, Building } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function TrustSection() {
  const [ref, inView] = useScrollAnimation({ triggerOnce: true });

  const logos = [
    { icon: Building2, name: "Nexus Hostels" },
    { icon: Home, name: "Elite PG" },
    { icon: Hotel, name: "Comfort Stays" },
    { icon: School, name: "UniResidences" },
    { icon: Briefcase, name: "Corporate Housing" },
    { icon: LocateIcon, name: "Metro Stays" },
    { icon: Landmark, name: "Heritage Hostels" },
    { icon: Building, name: "Skyline Living" },
  ];

  return (
    <section 
      ref={ref}
      className={`bg-white py-14 overflow-hidden border-b border-slate-100 relative z-10 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="max-w-[1440px] mx-auto text-center px-4">
        <p className="text-[12px] font-bold tracking-[2px] text-slate-400 uppercase mb-10">
          Trusted by leading hostels across India
        </p>

        {/* Marquee Container with Mask */}
        <div 
          className="relative flex overflow-hidden w-full max-w-full group" 
          style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
        >
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {/* Duplicate logos strictly via code structure for CSS loop */}
            {[...logos, ...logos].map((Logo, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 px-8 text-slate-400 opacity-60 hover:opacity-100 transition-all duration-300 cursor-pointer"
              >
                <Logo.icon size={26} className="text-[#6366f1] opacity-70 transition-all duration-300" />
                <span className="text-[18px] md:text-[20px] font-bold font-jakarta tracking-[-0.5px] text-slate-800">
                  {Logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
