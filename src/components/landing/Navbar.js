"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import axios from "axios";

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsMounted(true));
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignIn = async () => {
    try {
      // Clear any existing session
      console.log("[NAVBAR] Clearing session and redirecting to login");
      await axios.delete('/api/auth/session');
    } catch (e) {
      console.log("[NAVBAR] Session clear error (non-fatal):", e.message);
    }
    
    // Use window.location for hard redirect to ensure clean auth state
    // This forces full page reload and clears all client-side cache
    window.location.href = '/login';
  };

  const navLinks = [
    { name: "Features", href: "#features", priority: 1 },
    { name: "Modules", href: "#modules", priority: 1 },
    { name: "Pricing", href: "#pricing", priority: 1 },
    { name: "About", href: "#about", priority: 2 },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-[100] transition-all duration-500 border-b ${
        isMounted ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } ${
        scrolled
          ? "bg-white/80 backdrop-blur-[12px] border-slate-200 shadow-[0_1px_10px_rgba(0,0,0,0.02)] py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
        
        {/* Left Side */}
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#6366f1] to-[#3b82f6] shadow-[0_4px_10px_rgba(99,102,241,0.2)] group-hover:shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 21V9L12 3L20 9V21H14V14H10V21H4Z" />
            </svg>
          </div>
          <span className="text-slate-900 font-jakarta text-[22px] font-bold tracking-tight">HostelHub</span>
        </Link>

        {/* Center Links (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-6 lg:gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className={`text-[15px] text-slate-600 hover:text-[#6366f1] transition-all tracking-tight font-semibold hover:-translate-y-0.5 ${
                link.priority === 2 ? "hidden lg:block" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden lg:flex items-center gap-4">
            <button 
              onClick={handleSignIn}
              className="text-[15px] text-slate-600 hover:text-[#6366f1] transition-all font-semibold h-[44px] flex items-center px-4 hover:-translate-y-0.5 bg-transparent border-none cursor-pointer"
            >
              Sign In
            </button>
            <Link 
              href="/register" 
              className="h-[44px] flex items-center justify-center px-6 rounded-full text-[15px] font-extrabold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/5 hover:translate-y-[-2px] active:scale-[0.98] transition-all"
            >
              Get Started Free
            </Link>
          </div>
          
          {/* Hamburger Menu Toggle (Mobile & Tablet) */}
          <button 
            className="lg:hidden p-2 text-slate-700 hover:text-indigo-600 transition-colors bg-slate-100 rounded-lg"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-6 animate-in fade-in slide-in-from-right duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#6366f1] to-[#3b82f6]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 21V9L12 3L20 9V21H14V14H10V21H4Z" />
                </svg>
              </div>
              <span className="text-slate-900 font-jakarta text-[22px] font-bold tracking-tight">HostelHub</span>
            </div>
            <button 
              className="p-2 text-slate-500 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-8 mt-12">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-[24px] font-bold text-slate-900 tracking-tight"
              >
                {link.name}
              </Link>
            ))}
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignIn();
              }}
              className="text-[24px] font-bold text-slate-500 tracking-tight mt-4 bg-transparent border-none cursor-pointer"
            >
              Sign In
            </button>
          </div>

          <div className="mt-auto pb-10">
            <Link 
              href="/register" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-[60px] flex items-center justify-center rounded-2xl text-[18px] font-extrabold text-white bg-[#6366f1] shadow-[0_8px_30px_rgba(99,102,241,0.2)] transition-all"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
