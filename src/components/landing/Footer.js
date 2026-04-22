"use client";

import React from "react";
import Link from "next/link";
import { Send, Mail, Globe, ArrowUpRight } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function Footer() {
  const [ref, inView] = useScrollAnimation({ triggerOnce: true });

  const socialLinks = [
    { name: "Twitter", icon: Send, href: "#" },
    { name: "LinkedIn", icon: Mail, href: "#" },
    { name: "GitHub", icon: Globe, href: "#" },
    { name: "Website", icon: Globe, href: "#" },
  ];

  const footerLinks = [
    {
      title: "Product",
      links: ["Features", "Dashboard", "Mobile App", "Pricing", "Integrations"]
    },
    {
      title: "Company",
      links: ["About Us", "Our Story", "Careers", "Press", "Contact"]
    },
    {
      title: "Resources",
      links: ["Documentation", "Help Center", "Community", "API Reference", "Status"]
    },
    {
      title: "Legal",
      links: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Security"]
    }
  ];

  return (
    <footer 
      ref={ref}
      className={`bg-[#FDFDFF] pt-24 pb-12 relative overflow-hidden border-t border-slate-100 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="max-w-[1440px] mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 pb-16 border-b border-slate-100">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="text-slate-900 font-extrabold text-[24px] tracking-tight font-jakarta">HostelHub</span>
            </Link>
            <p className="mt-6 text-[16px] text-slate-500 font-medium leading-relaxed max-w-[300px]">
              Simplifying hostel living and management for thousands of students and managers worldwide.
            </p>
            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map((social, idx) => (
                <a 
                  key={idx} 
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm"
                  aria-label={social.name}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((col, idx) => (
            <div key={idx} className="flex flex-col gap-5">
              <h4 className="text-[14px] font-extrabold text-slate-900 uppercase tracking-[2px]">{col.title}</h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link 
                      href="#" 
                      className="text-[15px] text-slate-500 font-semibold hover:text-indigo-600 transition-colors flex items-center gap-1 group"
                    >
                      {link}
                      <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <span className="text-[14px] text-slate-400 font-bold tracking-widest uppercase">
              © 2025 HostelHub Inc.
            </span>
            <div className="hidden md:block w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-6">
              <Link href="#" className="text-[13px] text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest transition-colors">Privacy</Link>
              <Link href="#" className="text-[13px] text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest transition-colors">Terms</Link>
              <Link href="#" className="text-[13px] text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest transition-colors">Security</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-[1px]">Systems Operational</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
