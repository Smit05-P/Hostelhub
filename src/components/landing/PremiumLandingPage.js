"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Menu,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import ProductPreview from "./ProductPreview";
import BetaAccessRequest from "./BetaAccessRequest";

const features = [
  {
    icon: BedDouble,
    title: "Rooms & occupancy",
    description:
      "Keep room availability and resident allocations organized in one place.",
  },
  {
    icon: Users,
    title: "Resident records",
    description:
      "Manage resident profiles and hostel membership with a clear, shared view.",
  },
  {
    icon: CreditCard,
    title: "Fees & payments",
    description:
      "Track fee records and payment status without losing the wider context.",
  },
  {
    icon: Wrench,
    title: "Complaints & requests",
    description:
      "Give day-to-day issues a place to be recorded, reviewed, and updated.",
  },
  {
    icon: ClipboardList,
    title: "Notices & updates",
    description:
      "Keep hostel notices and important updates together for residents.",
  },
  {
    icon: ShieldCheck,
    title: "Visitor workflows",
    description:
      "Review visitor requests and keep the related information accessible.",
  },
];

const questions = [
  {
    question: "Is HostelHub available to everyone yet?",
    answer:
      "HostelHub is currently in beta. Request access below to register your interest; submitting the form saves a request and does not create an account.",
  },
  {
    question: "Can I explore the product without creating an account?",
    answer:
      "Yes. The product preview on this page is an interactive walkthrough using illustrative sample data. It is not connected to a live hostel or account.",
  },
  {
    question: "What does HostelHub cost?",
    answer:
      "Pricing has not been published. We will share current beta information when you request access or a guided demo.",
  },
  {
    question: "What can I manage with HostelHub?",
    answer:
      "The current platform includes workflows for hostel rooms, residents, fees and payments, complaints, notices, and visitor requests. Availability may evolve during beta.",
  },
];

function Brand({ inverse = false }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#51725c] ${
        inverse ? "text-white" : "text-[#1e3026]"
      }`}
      aria-label="HostelHub home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#55745d] text-white shadow-sm">
        <Building2 size={19} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="font-jakarta text-xl font-bold tracking-tight">
        HostelHub
      </span>
    </Link>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e5df] bg-[#f7f6f2]/95 backdrop-blur-lg">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          <a className="nav-link" href="#features">Platform</a>
          <a className="nav-link" href="#demo">Product preview</a>
          <a className="nav-link" href="#beta">Beta access</a>
          <a className="nav-link" href="#faq">FAQs</a>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a className="button button-light !min-h-11 !px-4" href="#beta">
            Join Beta Testing
          </a>
          <Link className="nav-link px-3" href="/login">Login</Link>
          <Link className="button button-dark !min-h-11 !px-5" href="/register">
            Register <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#e5e3dc] bg-white text-[#24352b] lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[#e7e5df] bg-[#f7f6f2] px-5 pb-6 pt-3 lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col">
            {[
              ["Explore Features", "#features"],
              ["View Product Demo", "#demo"],
              ["Book a Free Demo", "#beta"],
              ["Join Beta Testing", "#beta"],
              ["FAQs", "#faq"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={closeMenu}
                className="border-b border-[#e7e5df] py-4 font-semibold text-[#32443a]"
              >
                {label}
              </a>
            ))}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                className="button button-light"
                href="/login"
                onClick={closeMenu}
              >
                Login
              </Link>
              <Link
                className="button button-dark"
                href="/register"
                onClick={closeMenu}
              >
                Register
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
      <div className="pointer-events-none absolute -right-36 -top-32 h-[440px] w-[440px] rounded-full bg-[#dfe8df] opacity-70 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="max-w-2xl">
          <div className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-[#66836b]" />
            HostelHub is currently in beta
          </div>
          <h1 className="mt-7 font-jakarta text-[clamp(2.8rem,6.4vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[#1e3026]">
            Hostel operations, with room to breathe.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#647168] sm:text-xl">
            Bring rooms, residents, payments, and everyday requests into one
            clear workspace—designed for the people who keep a hostel running.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a className="button button-dark" href="#features">
              Explore Features <ArrowDown size={17} aria-hidden="true" />
            </a>
            <a className="button button-light" href="#beta">
              Book a Free Demo <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-[#68756d]">
            <span className="inline-flex items-center gap-2">
              <Check size={16} className="text-[#55745d]" aria-hidden="true" />
              Explore before you register
            </span>
            <span className="inline-flex items-center gap-2">
              <Check size={16} className="text-[#55745d]" aria-hidden="true" />
              Beta access by request
            </span>
          </div>
        </div>

        <div
          role="group"
          aria-label="Illustrative HostelHub dashboard preview"
          className="relative mx-auto w-full max-w-[540px]"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-[#dce6db]/70 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#e5e5dd] bg-white shadow-[0_30px_90px_-40px_rgba(27,48,36,0.35)]">
            <div className="flex items-center justify-between border-b border-[#eeede7] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3ec] text-[#55745d]">
                  <Building2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#26382d]">Property overview</p>
                  <p className="text-xs text-[#8a948c]">Sample workspace</p>
                </div>
              </div>
              <span className="rounded-full bg-[#f3f5ef] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#587260]">
                Preview
              </span>
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#7b877e]">Good morning</p>
                  <h2 className="mt-1 font-jakarta text-2xl font-semibold tracking-tight text-[#23352a]">
                    Your hostel, at a glance
                  </h2>
                </div>
                <span className="hidden rounded-xl bg-[#f5f4ef] px-3 py-2 text-xs font-semibold text-[#6a776e] sm:block">
                  Illustrative data
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  ["Residents", "128", "Current records"],
                  ["Occupied beds", "42 / 48", "Sample occupancy"],
                  ["Fee items", "6", "Awaiting review"],
                  ["Open requests", "3", "Needs attention"],
                ].map(([label, value, note]) => (
                  <div
                    className="rounded-2xl border border-[#eeede7] bg-[#fcfcfa] p-4"
                    key={label}
                  >
                    <p className="text-xs font-medium text-[#89938b]">{label}</p>
                    <p className="mt-2 font-jakarta text-2xl font-semibold tracking-tight text-[#26382d]">
                      {value}
                    </p>
                    <p className="mt-1 text-[11px] text-[#98a097]">{note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#20352a] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">A calmer daily overview</p>
                    <p className="mt-1 text-xs text-white/60">
                      Rooms, records, and requests together.
                    </p>
                  </div>
                  <Building2 size={22} className="text-[#bfd2bd]" aria-hidden="true" />
                </div>
                <div className="mt-5 flex h-12 items-end gap-2" aria-hidden="true">
                  {[34, 56, 42, 75, 58, 88, 67, 96, 72, 83, 61, 90].map(
                    (height, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-t-sm bg-[#b7cdb5]/80"
                        style={{ height: `${height}%` }}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
            <p className="border-t border-[#eeede7] px-5 py-3 text-center text-xs text-[#89938b]">
              Illustrative sample data — not connected to a live account
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-y border-[#e9e7e0] bg-white px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="section-kicker">A considered toolkit</p>
          <h2 className="section-title mt-4">
            The details of hostel life, in one view.
          </h2>
          <p className="section-copy mt-5">
            See the essentials together, so owners and managers can spend less
            time piecing information together.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className="rounded-2xl border border-[#e9e8e1] bg-[#fdfdfa] p-6 transition-transform duration-200 hover:-translate-y-1 sm:p-7"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  index % 2 === 0
                    ? "bg-[#eaf0e8] text-[#55745d]"
                    : "bg-[#f3eee6] text-[#936e4e]"
                }`}
              >
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-jakarta text-lg font-semibold text-[#24362b]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#748077]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Set up your property",
      description:
        "Create a hostel workspace and organize its rooms and resident details.",
    },
    {
      number: "02",
      title: "Bring daily operations together",
      description:
        "Review occupancy, fee records, complaints, notices, and visitor requests.",
    },
    {
      number: "03",
      title: "Keep everyone in the loop",
      description:
        "Give managers and residents a clearer place to follow their relevant updates.",
    },
  ];

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="section-kicker">A clearer rhythm</p>
          <h2 className="section-title mt-4">
            From scattered tasks to a shared picture.
          </h2>
          <p className="section-copy mt-5">
            HostelHub brings the day-to-day into a single workspace, while
            keeping each workflow easy to find.
          </p>
          <a className="button button-light mt-8" href="#demo">
            Explore the sample preview
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <ol className="divide-y divide-[#e5e4dc]">
          {steps.map((step) => (
            <li
              key={step.number}
              className="grid gap-3 py-6 sm:grid-cols-[60px_1fr] sm:gap-5 sm:py-7"
            >
              <span className="font-mono text-sm font-semibold text-[#8a9b8c]">
                {step.number}
              </span>
              <div>
                <h3 className="font-jakarta text-xl font-semibold text-[#25372d]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#748077]">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-[#e9e7e0] bg-white px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="section-kicker">Good to know</p>
          <h2 className="section-title mt-4">A few useful answers.</h2>
          <p className="section-copy mt-5">
            HostelHub is in beta. We keep the details clear while the product
            continues to evolve.
          </p>
        </div>
        <div className="divide-y divide-[#e9e8e1]">
          {questions.map(({ question, answer }) => (
            <details className="group py-5" key={question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-[#2c3d32] marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#55745d]">
                {question}
                <ChevronDown
                  size={18}
                  className="shrink-0 text-[#748077] transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="max-w-2xl pt-4 text-sm leading-7 text-[#748077]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#1e3026] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Brand inverse />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
            A clearer workspace for the people who make hostel life work.
            Currently in beta.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
          <a className="hover:text-white" href="#features">Features</a>
          <a className="hover:text-white" href="#demo">Demo</a>
          <a className="hover:text-white" href="#beta">Beta access</a>
          <Link className="hover:text-white" href="/login">Login</Link>
          <Link className="hover:text-white" href="/register">Register</Link>
        </nav>
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} HostelHub
        </p>
      </div>
    </footer>
  );
}

export default function PremiumLandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#1e3026]">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-lg bg-white p-3 text-[#1e3026] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      <div id="main-content">
        <Hero />
        <Features />
        <HowItWorks />
        <ProductPreview />
        <BetaAccessRequest />
        <FAQ />
      </div>
      <Footer />
    </main>
  );
}
