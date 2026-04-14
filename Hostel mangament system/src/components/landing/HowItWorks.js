"use client";

import React from "react";
import { Building2, Users, LayoutDashboard, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function HowItWorks() {
  const [headerRef, headerInView] = useScrollAnimation({ triggerOnce: true });

  const steps = [
    {
      num: "01",
      icon: Building2,
      color: "text-[#6366f1]",
      bg: "bg-[#6366f1]/10",
      title: "Register Your Hostel",
      desc: "Create your account, add hostel details, and set up your room infrastructure in minutes."
    },
    {
      num: "02",
      icon: Users,
      color: "text-[#3b82f6]",
      bg: "bg-[#3b82f6]/10",
      title: "Add Students & Rooms",
      desc: "Onboard residents digitally. Assign rooms, collect fees, and manage documents with ease."
    },
    {
      num: "03",
      icon: LayoutDashboard,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10",
      title: "Manage Everything Live",
      desc: "Track real-time occupancy, revenue, and complaints from one high-performance dashboard."
    }
  ];

  return (
    <section className="bg-slate-50/50 py-[120px] relative overflow-hidden font-sans border-y border-slate-100">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div ref={headerRef} className={`flex flex-col items-center mb-20 transition-all duration-700 ease-out ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
           <div className="inline-flex items-center justify-center h-[34px] px-4 bg-white border border-slate-200/80 rounded-full mb-6 shadow-sm">
            <span className="text-[12px] font-bold text-[#6366f1] tracking-[1px] uppercase">How It Works</span>
          </div>
          <h2 className="text-center text-[36px] md:text-[48px] font-extrabold text-slate-900 font-jakarta tracking-tight">
            Up and Running in 3 Simple Steps
          </h2>
          <p className="mt-4 text-center text-slate-500 max-w-[500px] font-medium text-[16px] md:text-[18px]">
            Experience a seamless transition to digital hostel management. No complex setup required.
          </p>
        </div>

        {/* Steps Container */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-0 max-w-[1250px] mx-auto">
          {steps.map((step, idx) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [stepRef, stepInView] = useScrollAnimation({ triggerOnce: true, threshold: 0.1 });
            return (
              <React.Fragment key={idx}>
                <div 
                  ref={stepRef}
                  style={{ transitionDelay: `${idx * 200}ms` }}
                  className={`relative flex flex-col items-center lg:items-start text-center lg:text-left flex-1 group w-full max-w-[360px] transition-all duration-1000 ease-out ${stepInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                >
                  <div className="absolute -top-[50px] sm:-top-[60px] left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 opacity-[0.05] font-jakarta font-extrabold text-[80px] sm:text-[100px] tracking-tight text-slate-900 select-none group-hover:opacity-[0.08] transition-opacity">
                    {step.num}
                  </div>
                  
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center ${step.bg} ${step.color} relative z-10 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-indigo-500/5 duration-500`}>
                    <step.icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-8 lg:h-8" />
                  </div>

                  <h3 className="mt-8 text-[22px] sm:text-[24px] font-extrabold text-slate-900 font-jakarta tracking-tight">
                    {step.title}
                  </h3>
                  
                  <p className="mt-3 text-[15px] sm:text-[16px] text-slate-500 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>

                {/* Connector Arrow (Hide on last item and mobile/tablet) */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center self-center px-6 flex-1 -mt-10">
                    <div className="w-full relative h-[1px] bg-slate-200">
                      <div className="absolute top-0 left-0 h-full w-[20%] bg-gradient-to-r from-transparent via-[#6366f1] to-transparent animate-marquee-fast" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
