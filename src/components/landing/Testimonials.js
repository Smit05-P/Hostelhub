"use client";

import React from "react";
import { Quote, Star } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function Testimonials() {
  const reviews = [
    {
      quote: "HostelHub transformed how we run our 200-bed hostel. Fee collection alone saves us 10 hours every month.",
      name: "Rajesh Kumar",
      role: "Hostel Manager, Pune",
      init: "RK",
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      quote: "The visitor pre-registration feature is brilliant. Parents love it and our security has improved dramatically.",
      name: "Priya Sharma",
      role: "Admin, Delhi Student Housing",
      init: "PS",
      color: "bg-blue-50 text-blue-600"
    },
    {
      quote: "From rooms to receipts, everything is in one place. I cannot imagine going back to spreadsheets.",
      name: "Mohammed Iqbal",
      role: "Owner, Bangalore PG Homes",
      init: "MI",
      color: "bg-emerald-50 text-emerald-600"
    }
  ];

  const [headerRef, headerInView] = useScrollAnimation({ triggerOnce: true });

  return (
    <section className="bg-[#FDFDFF] py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6">

        <div
          ref={headerRef}
          className={`text-center max-w-[800px] mx-auto transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-full mb-6">
            <Star size={14} className="fill-indigo-600 text-indigo-600" />
            <span className="text-[12px] font-bold text-indigo-600 tracking-wide uppercase">Trusted by 500+ Hostels</span>
          </div>
          <h2 className="text-[36px] md:text-[48px] font-extrabold text-slate-900 font-jakarta tracking-tight leading-[1.1]">
            Real Results from <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Real Managers.</span>
          </h2>
          <p className="mt-6 text-[18px] text-slate-500 font-medium leading-relaxed">
            See how smart hostel owners are using HostelHub to streamline operations and grow their business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 md:mt-24">
          {reviews.map((rev, idx) => (
            <TestimonialCard key={idx} rev={rev} delay={idx * 150} />
          ))}
        </div>

      </div>
    </section>
  );
}

function TestimonialCard({ rev, delay }) {
  const [ref, inView] = useScrollAnimation({ triggerOnce: true, threshold: 0.1 });

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`group bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
    >
      <div className="flex gap-1 mb-8">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
        ))}
      </div>

      <div className="relative">
        <Quote className="absolute -top-4 -left-2 w-10 h-10 text-indigo-50 opacity-5 group-hover:opacity-10 transition-opacity" />
        <p className="text-[17px] md:text-[19px] text-slate-700 font-medium leading-[1.7] relative z-10">
          &ldquo;{rev.quote}&rdquo;
        </p>
      </div>

      <div className="mt-10 flex items-center gap-4 border-t border-slate-50 pt-8">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0 ${rev.color} shadow-sm`}>
          {rev.init}
        </div>
        <div>
          <div className="text-[16px] text-slate-900 font-extrabold font-jakarta leading-none tracking-tight">{rev.name}</div>
          <div className="text-[14px] text-slate-500 font-semibold mt-1.5">{rev.role}</div>
        </div>
      </div>
    </div>
  );
}
