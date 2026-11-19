"use client";

import { useState } from "react";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Users,
} from "lucide-react";

const previewData = {
  overview: {
    title: "Workspace overview",
    description: "A sample view of the information managers can organize.",
    stats: [
      ["Residents", "128"],
      ["Occupied beds", "42 / 48"],
      ["Fee items", "6"],
      ["Open requests", "3"],
    ],
    columns: ["Area", "Sample status", "Details"],
    rows: [
      ["Room 101", "Occupied", "2 of 2 beds"],
      ["Room 102", "Available", "2 of 2 beds"],
      ["Room 103", "Partially occupied", "1 of 2 beds"],
    ],
  },
  rooms: {
    title: "Room directory",
    description: "Illustrative room and bed availability.",
    stats: [
      ["Rooms shown", "3"],
      ["Beds shown", "6"],
      ["Occupied beds", "3"],
      ["Available beds", "3"],
    ],
    columns: ["Room", "Occupancy", "Availability"],
    rows: [
      ["Room 101", "2 residents", "Full"],
      ["Room 102", "0 residents", "2 available"],
      ["Room 103", "1 resident", "1 available"],
    ],
  },
  payments: {
    title: "Fee tracking",
    description: "Illustrative payment records with no real resident data.",
    stats: [
      ["Records shown", "3"],
      ["Marked received", "2"],
      ["Awaiting review", "1"],
      ["Amounts", "Not shown"],
    ],
    columns: ["Record", "Status", "Period"],
    rows: [
      ["Resident 014", "Received", "Current period"],
      ["Resident 027", "Awaiting review", "Current period"],
      ["Resident 033", "Received", "Previous period"],
    ],
  },
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "rooms", label: "Rooms", icon: BedDouble },
  { id: "payments", label: "Payments", icon: CreditCard },
];

export default function ProductPreview() {
  const [activeTab, setActiveTab] = useState("overview");
  const data = previewData[activeTab];

  return (
    <section
      id="demo"
      className="scroll-mt-24 border-y border-[#e9e7e0] bg-[#f0f1eb] px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-kicker">Explore the product</p>
          <h2 className="section-title mt-4">
            Take a look around—no sign-in needed.
          </h2>
          <p className="section-copy mx-auto mt-5">
            Switch between a few sample views to see how hostel information can
            come together. This preview is illustrative only; it is not a live
            account or connected demo environment.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-[#e1e3dc] bg-white shadow-[0_25px_80px_-45px_rgba(31,49,38,0.4)]">
          <div className="flex flex-col gap-4 border-b border-[#eeede7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf0e8] text-[#55745d]">
                <Building2 size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-[#26382d]">HostelHub workspace</p>
                <p className="text-xs text-[#879188]">Interactive sample</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f2f5ef] px-3 py-1.5 text-xs font-semibold text-[#607463]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#77917a]" />
              Sample data only
            </span>
          </div>

          <div className="grid min-h-[440px] lg:grid-cols-[210px_1fr]">
            <aside className="hidden border-r border-[#eeede7] bg-[#fcfcfa] p-5 lg:block">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aa29a]">
                Sample menu
              </p>
              <div className="mt-4 space-y-1">
                {[
                  [LayoutDashboard, "Overview"],
                  [BedDouble, "Rooms"],
                  [Users, "Residents"],
                  [CreditCard, "Payments"],
                ].map(([Icon, label]) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                      label.toLowerCase() === activeTab
                        ? "bg-[#eaf0e8] font-semibold text-[#4d6d55]"
                        : "text-[#768178]"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-12 rounded-2xl bg-[#20352a] p-4 text-white">
                <p className="text-xs font-semibold">A single clear view</p>
                <p className="mt-2 text-xs leading-5 text-white/60">
                  Sample workspace content for this product preview.
                </p>
              </div>
            </aside>

            <div className="min-w-0 p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-jakarta text-xl font-semibold text-[#26382d]">
                    {data.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#879188]">{data.description}</p>
                </div>
                <div
                  className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#f5f5f0] p-1"
                  role="tablist"
                  aria-label="Sample dashboard views"
                >
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={id}
                      role="tab"
                      aria-selected={activeTab === id}
                      aria-controls="sample-dashboard-panel"
                      onClick={() => setActiveTab(id)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        activeTab === id
                          ? "bg-white text-[#344a39] shadow-sm"
                          : "text-[#7f8980] hover:text-[#344a39]"
                      }`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div id="sample-dashboard-panel" role="tabpanel" className="mt-6">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {data.stats.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#eeede7] p-4"
                    >
                      <p className="text-xs font-medium text-[#89938b]">{label}</p>
                      <p className="mt-2 font-jakarta text-xl font-semibold text-[#26382d]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-[#eeede7]">
                  <div className="flex items-center justify-between border-b border-[#eeede7] px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={16}
                        className="text-[#6a856e]"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-semibold text-[#344438]">
                        {activeTab === "payments" ? "Recent fee records" : "Sample records"}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#99a199]">Example only</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead className="bg-[#fafaf7] text-[11px] uppercase tracking-[0.1em] text-[#929b92]">
                        <tr>
                          {data.columns.map((column) => (
                            <th className="px-4 py-3 font-semibold sm:px-5" key={column}>
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0efe9]">
                        {data.rows.map((row) => (
                          <tr key={row[0]} className="text-[#59675d]">
                            {row.map((cell, index) => (
                              <td
                                className={`px-4 py-3.5 sm:px-5 ${
                                  index === 1 ? "font-medium text-[#3d5945]" : ""
                                }`}
                                key={cell}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-[#929b92]">
                These sample records are fictional and are not linked to any customer, resident, or live service.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#dfe3da] bg-white/70 p-5 sm:flex-row sm:px-7">
          <p className="text-center text-sm text-[#6d796f] sm:text-left">
            Want a guided walkthrough or information about beta access?
          </p>
          <a className="button button-dark !min-h-11 !px-5" href="#beta">
            Request a guided demo <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
