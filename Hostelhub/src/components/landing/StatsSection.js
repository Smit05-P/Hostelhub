"use client";

import React, { useState, useEffect, useRef } from "react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

function CountUp({ end, duration = 2000, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useScrollAnimation({ triggerOnce: true });
  const countRef = useRef(0);
  const startTime = useRef(null);

  useEffect(() => {
    if (inView) {
      const animate = (timestamp) => {
        if (!startTime.current) startTime.current = timestamp;
        const progress = Math.min((timestamp - startTime.current) / duration, 1);
        
        // Easing function: easeOutExpo
        const easeOutExpo = 1 - Math.pow(2, -10 * progress);
        const currentCount = Math.floor(easeOutExpo * end);
        
        setCount(currentCount);
        countRef.current = currentCount;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [inView, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const stats = [
    { num: 14000, suffix: "+", label: "Residents Managed" },
    { num: 2000, suffix: "+", label: "Hostels Onboarded" },
    { num: 50, suffix: "Cr+", prefix: "₹", label: "Rent Processed" },
    { num: 99.9, suffix: "%", label: "Platform Uptime", isFloat: true }
  ];

  return (
    <section className="bg-[#FDFDFF] py-20 sm:py-32 relative overflow-hidden border-b border-slate-100">
      {/* Subtle Background Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="group flex flex-col items-center text-center relative"
            >
              {/* Vertical line separator for desktop */}
              {idx !== 0 && (
                <div className="hidden lg:block absolute left-[-4px] top-1/2 -translate-y-1/2 w-px h-16 bg-slate-200" />
              )}
              
              <div className="text-[40px] md:text-[56px] lg:text-[64px] font-extrabold text-slate-900 font-jakarta tracking-tighter leading-none">
                {stat.prefix}
                <CountUp 
                  end={stat.num} 
                  suffix={stat.suffix} 
                  duration={2500}
                />
              </div>
              
              <div className="mt-4 text-[12px] md:text-[14px] text-slate-400 font-bold tracking-[2px] uppercase">
                {stat.label}
              </div>

              {/* Hover highlight effect */}
              <div className="absolute -inset-4 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl -z-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
