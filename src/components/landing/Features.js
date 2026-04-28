"use client";

import React, { useState } from "react";
import { Badge } from "./ui/Badge";
import { SectionLabel } from "./ui/SectionLabel";
import { BedDouble, Users, Wallet, ShieldCheck, Wrench, BarChart3, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";
import { Button } from "./ui/Button";

export default function Features() {
  const [headerRef, headerInView] = useScrollAnimation({ triggerOnce: true });
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      icon: BedDouble,
      iconBg: "bg-gradient-to-br from-[#2563EB] to-[#60A5FA]",
      title: "Room & Bed Management",
      desc: "Manage every room, floor, and bed. Track availability in real time.",
      details: [
        "Interactive floor plan view",
        "Real-time bed availability tracking",
        "Automated room allocation based on preferences",
        "Inventory tracking for each room (furniture, ACs, etc.)"
      ]
    },
    {
      icon: Users,
      iconBg: "bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]",
      title: "Student & Resident Hub",
      desc: "Digital onboarding, KYC, room allocation — all paperless.",
      details: [
        "100% paperless digital onboarding",
        "Automated KYC document verification workflows",
        "Centralized student directory with search filters",
        "Disciplinary and behavior logging system"
      ]
    },
    {
      icon: Wallet,
      iconBg: "bg-gradient-to-br from-[#059669] to-[#34D399]",
      title: "Smart Fee Collection",
      desc: "Automated rent reminders, instant receipts, and payment tracking.",
      details: [
        "Automated monthly rent invoice generation",
        "Integration with Razorpay/Stripe for online payments",
        "One-click PDF receipts via WhatsApp/Email",
        "Defaulter tracking and late fee automation"
      ]
    },
    {
      icon: ShieldCheck,
      iconBg: "bg-gradient-to-br from-[#EA580C] to-[#FBBF24]",
      title: "Visitor Authorization",
      desc: "Students pre-register visitors. Admins approve with one click.",
      details: [
        "QR code based visitor check-in system",
        "Instant admin approval push notifications",
        "Historical logs of all student visitors",
        "Overnight stay request workflows"
      ]
    },
    {
      icon: Wrench,
      iconBg: "bg-gradient-to-br from-[#DC2626] to-[#F87171]",
      title: "Complaint Tracker",
      desc: "Raise, track, and resolve complaints with full status transparency.",
      details: [
        "Categorized ticketing (Plumbing, Electrical, IT, etc.)",
        "SLA tracking to ensure fast resolution",
        "Photo uploads for better context",
        "Feedback rating upon ticket closure"
      ]
    },
    {
      icon: BarChart3,
      iconBg: "bg-gradient-to-br from-[#0891B2] to-[#22D3EE]",
      title: "Analytics & Reports",
      desc: "Visual dashboards showing occupancy, revenue, and hostel performance.",
      details: [
        "Real-time revenue and collection graphs",
        "Occupancy forecasting models",
        "Custom exportable reports (Excel/PDF)",
        "Automated daily snapshot emails to management"
      ]
    }
  ];

  return (
    <section id="features" className="bg-[var(--background)] py-24 lg:py-32 relative z-10">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div ref={headerRef} className={`flex flex-col items-center transition-all duration-700 ease-out ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <SectionLabel text="Powerful Features" />

          <div className="text-center mt-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-display text-[var(--foreground)] tracking-tight">
              Everything You Need To Run<br className="hidden sm:block" />A Perfect Hostel
            </h2>
            <p className="mt-6 text-lg md:text-xl text-[var(--muted-foreground)] leading-relaxed max-w-[650px] mx-auto font-medium">
              All modules work together seamlessly.<br className="hidden sm:block" />
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
                className={`w-full bg-[var(--card)] border border-[var(--border)] rounded-[20px] p-8 group hover:border-[var(--accent)]/50 hover:shadow-accent hover:-translate-y-1.5 transition-all duration-500 ease-out flex flex-col will-change-transform cursor-pointer ${cardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                onClick={() => setSelectedFeature(feat)}
              >
                <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center ${feat.iconBg} shadow-sm mb-8 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feat.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-[22px] font-bold text-[var(--foreground)] font-display tracking-tight">
                  {feat.title}
                </h3>

                <p className="mt-3 text-[16px] text-[var(--muted-foreground)] leading-relaxed flex-grow font-medium">
                  {feat.desc}
                </p>

                <div className="mt-8 flex items-center gap-2 text-[14px] font-bold text-[var(--accent)] uppercase tracking-[1px] transition-colors group-hover:text-[var(--accent-secondary)]">
                  Learn more
                  <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Modal Overlay */}
      {selectedFeature && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer" 
            onClick={() => setSelectedFeature(null)}
          />
          <div className="relative w-full max-w-lg bg-[var(--background)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-400">
            {/* Modal Header */}
            <div className={`p-8 ${selectedFeature.iconBg} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10" />
              <button 
                onClick={() => setSelectedFeature(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>
              <div className="relative z-10 flex flex-col items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30">
                  <selectedFeature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white tracking-tight">
                  {selectedFeature.title}
                </h3>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-8">
              <p className="text-[var(--foreground)] text-lg font-medium leading-relaxed mb-6">
                {selectedFeature.desc}
              </p>
              
              <div className="space-y-4 mb-8">
                {selectedFeature.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                    <span className="text-[var(--muted-foreground)] font-medium">{detail}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFeature(null)}
                >
                  Close
                </Button>
                <Button href="/register" className="shadow-accent">
                  Try it Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
