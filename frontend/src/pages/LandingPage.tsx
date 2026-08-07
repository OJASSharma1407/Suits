import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Zap, BookOpen, ArrowRight, Shield } from "lucide-react";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      navigate(`/search?query=${encodeURIComponent(query)}`);
    } else {
      navigate("/search");
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Decorative orbs */}
      <div className="orb orb-1" style={{ top: "10%", right: "-5%", opacity: 0.4 }} />
      <div className="orb orb-2" style={{ bottom: "15%", left: "-8%", opacity: 0.35 }} />

      {/* Navigation */}
      <header
        className="h-[72px] flex items-center justify-between px-8 md:px-12 w-full relative z-10 glass"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          to="/"
          className="font-semibold text-lg tracking-tight flex items-center gap-2.5"
          style={{ color: "var(--text-primary)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            S
          </div>
          SUITS
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="btn-primary"
            style={{ padding: "10px 24px", fontSize: "13px" }}
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto w-full relative z-10">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase mb-8"
          style={{
            background: "var(--surface-container)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            letterSpacing: "0.06em",
          }}
        >
          <Zap size={13} /> Powered by eCourts + Gemini AI
        </div>

        {/* Headline */}
        <h1
          className="text-4xl sm:text-5xl md:text-[64px] leading-[1.1] tracking-tight mb-6"
          style={{ fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}
        >
          Legal research,{" "}
          <span style={{ color: "var(--text-muted)" }}>reimagined with AI</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-base md:text-lg max-w-2xl mb-10 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          SUITS transforms India's official court records into an intelligent research
          experience. Search, understand, and analyse cases — in plain language.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-xl relative mb-4">
          <Search
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by party, CNR, advocate, or keyword..."
            className="w-full pl-13 pr-32 py-4 text-sm rounded-full outline-none"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              paddingLeft: "48px",
              boxShadow: "var(--shadow-card)",
            }}
          />
          <button
            type="submit"
            className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
            style={{ padding: "10px 24px", fontSize: "13px" }}
          >
            Search <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Try: "State vs Ramesh Kumar Delhi" or paste a CNR number
        </p>
      </main>

      {/* Trusted By Banner */}
      <div
        className="py-6 text-center text-[11px] font-medium uppercase tracking-[0.12em] relative z-10"
        style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
      >
        Trusted by legal professionals across India
      </div>

      {/* Features Section */}
      <section
        className="py-20 px-6 md:px-12 w-full relative z-10"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-12"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
          >
            Built for the way you research
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Intelligent Search",
                desc: "Search across courts by party name, advocate, judge, CNR, year, and case type with dynamic filtering.",
              },
              {
                icon: Zap,
                title: "AI Case Analysis",
                desc: "Generate structured briefs with facts, legal issues, court reasoning, and ratio decidendi — powered by Gemini AI.",
              },
              {
                icon: BookOpen,
                title: "Official eCourts Data",
                desc: "Every insight is grounded in authoritative judicial records with exact dates, judges, and citations.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="card-float p-8 space-y-4"
                style={{ minHeight: "200px" }}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--surface-container)", color: "var(--text-primary)" }}
                >
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-center text-xs relative z-10"
        style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
      >
        SUITS &copy; {new Date().getFullYear()}. Built on official eCourts Partner APIs. Professional Legal Workspace.
      </footer>
    </div>
  );
}
