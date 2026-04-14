"use client";

import React, { useState } from "react";
import { CheckCircle2, Zap, Shield, Rocket, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [headerRef, headerInView] = useScrollAnimation({ triggerOnce: true });

  const plans = [
    {
      name: "Starter",
      icon: <Rocket className="text-blue-500" size={24} />,
      price: isYearly ? 799 : 999,
      desc: "Ideal for single hostel owners starting out.",
      features: ["1 Hostel", "Up to 50 students", "Basic fee tracking", "Visitor log", "Email support"],
      cta: "Get Started",
      highlight: false
    },
    {
      name: "Professional",
      icon: <Zap className="text-white" size={24} />,
      price: isYearly ? 1599 : 1999,
      desc: "For growing businesses managing multiple properties.",
      features: ["Up to 5 Hostels", "Unlimited students", "Advanced analytics", "Visitor pre-registration", "Complaint tracker", "Priority support"],
      cta: "Start Free Trial",
      highlight: true
    },
    {
      name: "Enterprise",
      icon: <Shield className="text-slate-600" size={24} />,
      price: "Custom",
      desc: "Tailored solutions for large-scale operations.",
      features: ["Unlimited Hostels", "Full API Access", "Custom Integrations", "Dedicated Account Manager", "SLA Guarantees", "On-site Training"],
      cta: "Talk to Sales",
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="bg-[#FDFDFF] py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6">
        
        <div 
          ref={headerRef}
          className={`text-center max-w-[800px] mx-auto transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100/50 rounded-full mb-6">
            <span className="text-[12px] font-bold text-blue-600 tracking-wide uppercase">Simple Transparent Pricing</span>
          </div>
          <h2 className="text-[36px] md:text-[48px] font-extrabold text-slate-900 font-jakarta tracking-tight leading-[1.1]">
            Plans That Scale With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Your Business.</span>
          </h2>
          
          {/* Toggle */}
          <div className="mt-12 flex items-center justify-center gap-5">
            <span className={`text-[15px] font-bold transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="w-[60px] h-[32px] bg-slate-100 rounded-full relative p-1 transition-all border border-slate-200"
            >
              <div className={`w-6 h-6 bg-[#6366f1] rounded-full absolute top-[3px] transition-all duration-300 shadow-sm ${isYearly ? 'left-[31px]' : 'left-[3px]'}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-[15px] font-bold transition-colors ${isYearly ? 'text-slate-900' : 'text-slate-400'}`}>Yearly</span>
              <span className="bg-emerald-100 text-emerald-600 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <PricingCard key={idx} plan={plan} delay={idx * 150} isYearly={isYearly} />
          ))}
        </div>

      </div>
    </section>
  );
}

function PricingCard({ plan, delay, isYearly }) {
  const [ref, inView] = useScrollAnimation({ triggerOnce: true, threshold: 0.1 });

  return (
    <div 
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`group relative flex flex-col p-8 md:p-10 rounded-[32px] transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${plan.highlight ? 'bg-slate-900 text-white shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-500/10' : 'bg-white border border-slate-100 shadow-sm hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5'}`}
    >
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase shadow-lg">
          Best Value
        </div>
      )}

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${plan.highlight ? 'bg-white/10' : 'bg-slate-50'}`}>
        {plan.icon}
      </div>

      <h3 className={`text-[24px] font-extrabold font-jakarta ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
        {plan.name}
      </h3>
      <p className={`mt-3 text-[15px] font-medium leading-relaxed ${plan.highlight ? 'text-slate-300' : 'text-slate-500'}`}>
        {plan.desc}
      </p>

      <div className="mt-8 flex items-baseline gap-2">
        <span className={`text-[44px] font-extrabold tracking-tight ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
          {typeof plan.price === 'number' ? `₹${plan.price}` : plan.price}
        </span>
        {typeof plan.price === 'number' && (
          <span className={`text-[16px] font-semibold ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
            /month
          </span>
        )}
      </div>

      <div className={`w-full h-px my-8 ${plan.highlight ? 'bg-white/10' : 'bg-slate-100'}`} />

      <ul className="flex flex-col gap-4 flex-grow mb-10">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-center gap-3">
            <CheckCircle2 size={18} className={plan.highlight ? 'text-blue-400' : 'text-blue-600'} />
            <span className={`text-[15px] font-bold ${plan.highlight ? 'text-slate-200' : 'text-slate-700'}`}>
              {feat}
            </span>
          </li>
        ))}
      </ul>

      <button className={`w-full h-[56px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${plan.highlight ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-white/5' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
        {plan.cta} <ArrowRight size={18} />
      </button>
    </div>
  );
}
