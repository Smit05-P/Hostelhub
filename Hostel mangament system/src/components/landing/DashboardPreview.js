"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, LayoutDashboard, Users, DoorOpen, IndianRupee, Bell, 
  Settings, Search, User, Home, CreditCard, MapPin, Lock, TrendingUp, TrendingDown, AlertCircle, FileText,
  MousePointer2, Sparkles, Monitor, ArrowRight
} from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function DashboardPreview() {
  const [view, setView] = useState("admin");
  const [leftRef, leftInView] = useScrollAnimation({ triggerOnce: true });
  const [rightRef, rightInView] = useScrollAnimation({ triggerOnce: true, threshold: 0.2 });

  const checklist = [
    "Manage admissions seamlessly",
    "Track pending fees & payments",
    "Monitor room occupancy live",
    "Digital visitor & gate passes"
  ];

  /* Mock Data */
  const adminStats = [
    { label: "Total Students", value: "1,248", trend: "+12%", up: true },
    { label: "Rooms Occupied", value: "842/900", trend: "93%", up: true },
    { label: "Pending Fees", value: "₹ 2.4L", trend: "-5%", up: false },
    { label: "Visitors Today", value: "45", trend: "+15%", up: true }
  ];

  const adminStudents = [
    { name: "Rahul Sharma", room: "A-102", status: "Paid", date: "12 Aug, 2023" },
    { name: "Sneha Patel", room: "B-204", status: "Pending", date: "14 Aug, 2023" },
    { name: "Amit Kumar", room: "A-305", status: "Paid", date: "15 Aug, 2023" },
    { name: "Priya Singh", room: "C-410", status: "Pending", date: "16 Aug, 2023" }
  ];

  const studentStats = [
    { label: "Upcoming Due", value: "₹ 12,500", trend: "in 5 days", up: false },
    { label: "My Room", value: "B-204", trend: "Block B", up: true },
    { label: "Remaining Passes", value: "2", trend: "This month", up: false },
    { label: "Active Complaints", value: "0", trend: "Resolved", up: true }
  ];

  const studentTransactions = [
    { title: "Semester 4 Fee", amount: "₹ 12,500", status: "Pending", date: "01 Feb, 2024" },
    { title: "Mess Bill - Jan", amount: "₹ 3,200", status: "Paid", date: "05 Jan, 2024" },
    { title: "Semester 3 Fee", amount: "₹ 12,500", status: "Paid", date: "01 Aug, 2023" },
    { title: "Security Deposit", amount: "₹ 5,000", status: "Paid", date: "10 Jul, 2023" }
  ];

  return (
    <section className="bg-[#FDFDFF] py-[120px] overflow-hidden relative z-10 font-sans border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-6 h-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Side (40%) */}
        <div 
          ref={leftRef}
          className={`w-full lg:w-[40%] flex flex-col items-start text-left shrink-0 transition-all duration-700 ease-out ${leftInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-full mb-8">
            <Sparkles size={14} className="text-[#6366f1]" />
            <span className="text-[12px] font-bold text-[#6366f1] tracking-wide uppercase">Dual Experience</span>
          </div>
          
          <h2 className="text-[36px] md:text-[44px] leading-[1.1] font-extrabold text-slate-900 font-jakarta tracking-tight">
            The Only Platform <br className="hidden sm:block"/> Built for Both.
          </h2>
          
          <p className="mt-5 text-[16px] md:text-[18px] text-slate-500 font-medium leading-relaxed max-w-[500px]">
            A powerful nerve center for admins to manage complex operations, and a beautiful, simplified portal for students to manage their daily life.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-[#6366f1] shrink-0 border border-indigo-100/30">
                  <CheckCircle2 size={14} />
                </div>
                <span className="text-[16px] text-slate-700 font-semibold">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button className="h-[48px] px-8 rounded-full bg-slate-900 text-white font-bold text-[15px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
               See Live Demo <ArrowRight size={16} />
            </button>
            <button className="h-[48px] px-8 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-[15px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
               <Monitor size={16} /> Desktop View
            </button>
          </div>
        </div>

        {/* Right Side (60%) - Realistic Mockup */}
        <div 
          ref={rightRef}
          className={`w-full lg:w-[60%] relative transition-all duration-1000 delay-200 ease-out ${rightInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}
        >
          {/* Decorative Glow */}
          <div className="absolute -inset-4 bg-indigo-500/5 rounded-[40px] blur-3xl -z-10" />
          
          {/* Persistent Floating UI Elements */}
          <div className="absolute -left-6 top-[20%] z-[60] animate-float pointer-events-none hidden md:block" style={{ animationDelay: '0ms' }}>
            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#6366f1] flex items-center justify-center border border-indigo-100/50">
                <MousePointer2 size={16} />
              </div>
              <span className="text-[13px] font-bold text-slate-800 whitespace-nowrap">{view === 'admin' ? 'Quick Actions' : 'One-Tap Payments'}</span>
            </div>
          </div>

          <div className="absolute -right-4 bottom-[25%] z-[60] animate-float pointer-events-none hidden md:block" style={{ animationDelay: '1000ms' }}>
             <div className="bg-[#6366f1] px-4 py-2.5 rounded-2xl shadow-2xl shadow-indigo-500/20 flex items-center gap-3 ring-4 ring-white">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <span className="text-[13px] font-bold text-white whitespace-nowrap">{view === 'admin' ? 'Live Analytics' : 'Digital Passes'}</span>
             </div>
          </div>

          {/* Floating Toggle */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 bg-white p-1.5 rounded-full flex gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 ring-4 ring-slate-50/50">
            <button 
              onClick={() => setView('admin')} 
              className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${view === 'admin' ? 'bg-[#6366f1] text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Settings size={14} /> Admin
            </button>
            <button 
              onClick={() => setView('student')} 
              className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${view === 'student' ? 'bg-[#6366f1] text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <User size={14} /> Student
            </button>
          </div>

          {/* Browser Window UI */}
          <div className="relative rounded-[24px] border border-slate-200/60 bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col h-[520px] sm:h-[600px] ring-1 ring-slate-200">
            {/* Browser Header */}
            <div className="h-12 bg-slate-50 flex items-center px-4 border-b border-slate-200 shrink-0">
              <div className="flex gap-2 w-24">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-slate-200 px-6 sm:px-16 py-1 rounded-lg text-[11px] text-slate-400 font-mono flex items-center gap-2 w-full max-w-[280px] justify-center truncate">
                  <Lock size={10} /> hostelhub.com/dashboard
                </div>
              </div>
              <div className="w-24"></div>
            </div>

            {/* Dashboard Content - Smooth Transitions between views */}
            <div className="flex flex-1 overflow-hidden bg-white relative">
              {/* Sidebar */}
              <div className="w-[170px] bg-slate-50 border-r border-slate-200 shrink-0 hidden md:flex flex-col">
                 <div className="p-4 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-900 text-[14px]">
                    <div className="w-6 h-6 bg-[#6366f1] rounded-md flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Home size={12} />
                    </div>
                    HostelHub
                 </div>
                 
                 <div className="p-3 flex flex-col gap-1 overflow-y-auto">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 mt-2 px-2 tracking-wider">Dashboard</div>
                    
                    {view === 'admin' ? (
                      <>
                        <SidebarItem icon={<LayoutDashboard size={14}/>} label="Overview" active />
                        <SidebarItem icon={<Users size={14}/>} label="Students" />
                        <SidebarItem icon={<DoorOpen size={14}/>} label="Rooms" />
                        <SidebarItem icon={<IndianRupee size={14}/>} label="Finances" />
                        <SidebarItem icon={<FileText size={14}/>} label="Reports" />
                      </>
                    ) : (
                      <>
                        <SidebarItem icon={<LayoutDashboard size={14}/>} label="My Profile" active />
                        <SidebarItem icon={<MapPin size={14}/>} label="Room Info" />
                        <SidebarItem icon={<CreditCard size={14}/>} label="Fees Due" />
                        <SidebarItem icon={<Bell size={14}/>} label="Notices" />
                      </>
                    )}
                 </div>
              </div>

              {/* Main Body */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 bg-white/50 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
                   <div className="font-extrabold text-slate-900 text-[15px] tracking-tight">
                      {view === 'admin' ? 'Admin Control' : 'Student Portal'}
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="relative hidden lg:block">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search..." className="bg-slate-100 border-none rounded-full pl-9 pr-4 py-1.5 text-[12px] w-36 focus:ring-2 focus:ring-[#6366f1] outline-none" disabled />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#3b82f6] flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
                        {view === 'admin' ? 'AD' : 'ST'}
                      </div>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 transition-all duration-500">
                   {/* Realistic View Change (Opacities) */}
                   <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                      {/* Grid Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {(view === 'admin' ? adminStats : studentStats).map((stat, i) => (
                          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-[#6366f1]/20 transition-all group">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                            <div className="text-[20px] font-extrabold text-slate-900 mt-1 tracking-tight">{stat.value}</div>
                            <div className={`text-[11px] font-bold flex items-center gap-1 mt-2 ${stat.up ? 'text-emerald-500' : 'text-slate-500'}`}>
                              {stat.up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {stat.trend}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Content Row */}
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                         {/* Table */}
                         <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                               <h3 className="font-bold text-slate-800 text-[14px]">{view === 'admin' ? 'Recent Admissions' : 'Payments'}</h3>
                               <div className="w-2 h-2 rounded-full bg-indigo-100 animate-pulse" />
                            </div>
                            <div className="p-0 overflow-x-auto">
                               <table className="w-full text-left bg-white">
                                  <thead>
                                     <tr className="border-b border-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                        <th className="px-5 py-3 font-semibold">{view === 'admin' ? 'User' : 'Item'}</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold text-right">Amount</th>
                                     </tr>
                                  </thead>
                                  <tbody className="text-[12px]">
                                     {(view === 'admin' ? adminStudents : studentTransactions).map((row, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0">
                                           <td className="px-5 py-3 font-bold text-slate-900">{view === 'admin' ? row.name : row.title}</td>
                                           <td className="px-5 py-3">
                                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                 {row.status}
                                              </span>
                                           </td>
                                           <td className="px-5 py-3 font-bold text-slate-900 text-right">{view === 'admin' ? row.room : row.amount}</td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                         
                         {/* Mini Chart */}
                         <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg shadow-slate-900/10">
                            <div>
                               <div className="text-[12px] font-bold text-slate-400">Total Revenue</div>
                               <div className="text-[28px] font-extrabold mt-1 tracking-tight">₹ 14.5L</div>
                               <div className="mt-4 flex gap-1 items-end h-[60px]">
                                  {[30, 60, 45, 90, 70, 40, 100].map((h, i) => (
                                    <div key={i} className="flex-1 bg-white/10 rounded-sm relative overflow-hidden">
                                       <div className="absolute bottom-0 left-0 w-full bg-[#6366f1] transition-all duration-1000" style={{ height: `${h}%` }} />
                                    </div>
                                  ))}
                               </div>
                            </div>
                            <button className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-[12px] font-bold">Generate Report</button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function SidebarItem({ icon, label, active }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all ${active ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
      <div className={`${active ? 'text-white' : 'text-slate-400'}`}>{icon}</div>
      <span className="truncate">{label}</span>
    </div>
  )
}
