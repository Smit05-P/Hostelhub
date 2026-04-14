"use client";

import React from "react";
import { Badge } from "./ui/Badge";
import { SectionLabel } from "./ui/SectionLabel";
import { BedDouble, Users, Wallet, ShieldCheck, Wrench, BarChart3, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function Features() {
  const [headerRef, headerInView] = useScrollAnimation({ triggerOnce: true });
  
  const features = [
    {
      icon: BedDouble,
      iconBg: "bg-gradient-to-br from-[#2563EB] to-[#60A5FA]",
      title: "Room & Bed Management",
      desc: "Manage every room, floor, and bed. Track availability in real time."
    },
    {
      icon: Users,
      iconBg: "bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]",
      title: "Student & Resident Hub",
      desc: "Digital onboarding, KYC, room allocation — all paperless."
    },
    {
      icon: Wallet,
      iconBg: "bg-gradient-to-br from-[#059669] to-[#34D399]",
      title: "Smart Fee Collection",
      desc: "Automated rent reminders, instant receipts, and payment tracking."
    },
    {
      icon: ShieldCheck,
      iconBg: "bg-gradient-to-br from-[#EA580C] to-[#FBBF24]",
      title: "Visitor Authorization",
      desc: "Students pre-register visitors. Admins approve with one click."
    },
    {
      icon: Wrench,
      iconBg: "bg-gradient-to-br from-[#DC2626] to-[#F87171]",
      title: "Complaint Tracker",
      desc: "Raise, track, and resolve complaints with full status transparency."
    },
    {
      icon: BarChart3,
      iconBg: "bg-gradient-to-br from-[#0891B2] to-[#22D3EE]",
      title: "Analytics & Reports",
      desc: "Visual dashboards showing occupancy, revenue, and hostel performance."
    }
  ];

  return (
    <section id="features" className="bg-[#FDFDFF] py-[120px] relative z-10 font-sans">
      <div className="max-w-[1440px] mx-auto px-6">
        
        {/* Header */}
        <div ref={headerRef} className={`flex flex-col items-center transition-all duration-700 ease-out ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center justify-center h-[34px] px-4 bg-white border border-slate-200/80 rounded-full mb-6 shadow-sm">
            <span className="text-[12px] font-bold text-[#6366f1] tracking-[1px] uppercase">Powerful Features</span>
          </div>
          
          <div className="text-center">
            <h2 className="text-[40px] md:text-[56px] leading-[1.1] font-extrabold text-slate-900 font-jakarta tracking-tight">
              Everything You Need To Run<br className="hidden sm:block"/>A Perfect Hostel
            </h2>
            <p className="mt-6 text-[18px] md:text-[20px] text-slate-500 leading-relaxed max-w-[650px] mx-auto font-medium">
              All modules work together seamlessly.<br className="hidden sm:block"/>
              No more switching between multiple tools.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1250px] mx-auto">
          {features.map((feat, idx) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [cardRef, cardInView] = useScrollAnimation({ triggerOnce: true, threshold: 0.1 });
            return (
              <div 
                key={idx}
                ref={cardRef}
                style={{ transitionDelay: `${Math.min(idx * 100, 500)}ms` }}
                className={`w-full bg-white border border-slate-200/80 rounded-[20px] p-8 group hover:border-[#6366f1]/50 hover:shadow-[0_20px_40px_rgba(99,102,241,0.08)] hover:-translate-y-1.5 transition-all duration-500 ease-out flex flex-col will-change-transform ${cardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              >
                <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center ${feat.iconBg} shadow-[0_8px_20px_rgba(0,0,0,0.12)] mb-8 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feat.icon className="w-7 h-7 text-white" />
                </div>
  
                <h3 className="text-[22px] font-extrabold text-slate-900 font-jakarta tracking-tight">
                  {feat.title}
                </h3>
                
                <p className="mt-3 text-[16px] text-slate-500 leading-relaxed flex-grow font-medium">
                  {feat.desc}
                </p>
  
                <div className="mt-8 flex items-center gap-2 text-[14px] font-bold text-[#6366f1] group-cursor-pointer uppercase tracking-[1px] transition-colors group-hover:text-[#4f46e5]">
                  Learn more
                  <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
