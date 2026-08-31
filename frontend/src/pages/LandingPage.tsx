import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Scale, Search, BarChart2, Bookmark } from "lucide-react";

/* ── Design tokens ── */
const GOLD = "#C9A85C";
const GOLD_DARK = "#B8933E";
const BG = "#18160F";
const BG_CARD = "#211E15";
const BG_SECTION = "#1D1B12";
const BORDER = "rgba(201,168,92,0.15)";
const TEXT_PRIMARY = "#F2EAD8";
const TEXT_DIM = "rgba(242,234,216,0.72)";
const TEXT_MUTED = "rgba(242,234,216,0.45)";

export default function LandingPage() {
  const heroInnerRef = useRef<HTMLDivElement>(null);

  /* Subtle 3-D tilt on hero text */
  useEffect(() => {
    const el = heroInnerRef.current;
    if (!el) return;

    const parent = el.closest(".lp-hero") as HTMLElement | null;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();

      const x =
        ((e.clientX - rect.left) / rect.width - 0.5) * 6;

      const y =
        ((e.clientY - rect.top) / rect.height - 0.5) * 4;

      el.style.transform = `
        perspective(900px)
        rotateX(${-y}deg)
        rotateY(${x}deg)
      `;
    };

    const onLeave = () => {
      el.style.transform =
        "perspective(900px) rotateX(0) rotateY(0)";
    };

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);

    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .lp {
          min-height: 100vh;
          background: ${BG};
          color: ${TEXT_PRIMARY};
          font-family: 'Inter', system-ui, sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        .lp::before {
          content: '';
          position: fixed;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(
            ellipse,
            rgba(201,168,92,0.07) 0%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        /* Nav */
        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 56px;
          height: 68px;
          border-bottom: 1px solid ${BORDER};
          background: rgba(24,22,15,0.90);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .lp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: ${TEXT_PRIMARY};
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          font-weight: 600;
        }

        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 36px;
        }

        .lp-nav-link {
          font-size: 13.5px;
          font-weight: 500;
          color: ${TEXT_DIM};
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: color .2s;
        }

        .lp-nav-link:hover,
        .lp-nav-link.active {
          color: ${TEXT_PRIMARY};
        }

        .lp-nav-link.active {
          border-bottom: 1.5px solid ${GOLD};
          padding-bottom: 2px;
        }

        .lp-nav-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .lp-signin {
          font-size: 13.5px;
          font-weight: 500;
          color: ${TEXT_DIM};
          text-decoration: none;
          transition: color .2s;
        }

        .lp-signin:hover {
          color: ${TEXT_PRIMARY};
        }

        /* Gold pill button */
        .lp-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          background: ${GOLD};
          color: #1A1208;
          text-decoration: none;
          transition:
            background .2s,
            transform .15s,
            box-shadow .2s;
          box-shadow:
            0 2px 16px rgba(201,168,92,0.25);
        }

        .lp-btn:hover {
          background: ${GOLD_DARK};
          transform: translateY(-1px);
          box-shadow:
            0 4px 24px rgba(201,168,92,0.38);
        }

        .lp-btn:active {
          transform: translateY(0);
        }

        .lp-btn-sm {
          font-size: 13px;
          padding: 9px 22px;
        }

        .lp-btn-lg {
          font-size: 15px;
          padding: 14px 38px;
        }

        /* Hero */
        .lp-hero {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 140px 24px 160px;
          min-height: calc(100vh - 68px);
        }

        .lp-hero-inner {
          transition: transform .08s linear;
          will-change: transform;
          max-width: 820px;
          width: 100%;
        }

        .lp-h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(46px, 7vw, 80px);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.025em;
          margin: 0 0 24px;
          color: ${TEXT_PRIMARY};
        }

        .lp-h1 .gold {
          color: ${GOLD};
          display: block;
        }

        .lp-subtitle {
          font-size: 17px;
          line-height: 1.7;
          color: ${TEXT_DIM};
          max-width: 520px;
          margin: 0 auto 52px;
        }

        /* Features */
        .lp-features {
          position: relative;
          z-index: 1;
          padding: 100px 56px;
          background: ${BG_SECTION};
          border-top: 1px solid ${BORDER};
        }

        .lp-features-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .lp-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 600;
          color: ${TEXT_PRIMARY};
          text-align: center;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }

        .lp-section-sub {
          font-size: 15px;
          color: ${TEXT_DIM};
          text-align: center;
          margin: 0 0 64px;
          line-height: 1.6;
        }

        .lp-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .lp-card {
          background: ${BG_CARD};
          border: 1px solid ${BORDER};
          border-radius: 16px;
          padding: 36px 30px 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition:
            border-color .25s,
            transform .2s,
            box-shadow .25s;
        }

        .lp-card:hover {
          border-color: rgba(201,168,92,0.42);
          transform: translateY(-4px);
          box-shadow:
            0 12px 40px rgba(0,0,0,0.45);
        }

        .lp-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(201,168,92,0.10);
          border: 1px solid rgba(201,168,92,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${GOLD};
        }

        .lp-card-title {
          font-size: 16px;
          font-weight: 600;
          color: ${TEXT_PRIMARY};
          margin: 0;
          letter-spacing: -0.01em;
        }

        .lp-card-desc {
          font-size: 14px;
          line-height: 1.65;
          color: ${TEXT_DIM};
          margin: 0;
        }

        /* CTA */
        .lp-cta {
          position: relative;
          z-index: 1;
          padding: 120px 56px;
          text-align: center;
          border-top: 1px solid ${BORDER};
          background: ${BG};
          overflow: hidden;
        }

        .lp-cta::before {
          content: '';
          position: absolute;
          bottom: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(
            ellipse,
            rgba(201,168,92,0.08) 0%,
            transparent 70%
          );
          pointer-events: none;
        }

        .lp-cta-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(28px, 4vw, 46px);
          font-weight: 700;
          color: ${TEXT_PRIMARY};
          margin: 0 0 14px;
          letter-spacing: -0.025em;
        }

        .lp-cta-sub {
          font-size: 16px;
          color: ${TEXT_DIM};
          display: block;
          max-width: 440px;
          margin: 0 auto 40px;
          line-height: 1.65;
        }

        /* Footer */
        .lp-footer {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 56px;
          border-top: 1px solid ${BORDER};
          background: ${BG_SECTION};
          flex-wrap: wrap;
          gap: 16px;
        }

        .lp-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .lp-footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 15px;
          font-weight: 600;
          color: ${TEXT_PRIMARY};
          text-decoration: none;
        }

        .lp-footer-tagline {
          font-size: 12px;
          color: ${TEXT_MUTED};
          padding-left: 24px;
        }

        .lp-footer-links {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .lp-footer-link {
          font-size: 12.5px;
          color: ${TEXT_MUTED};
          text-decoration: none;
          transition: color .2s;
        }

        .lp-footer-link:hover {
          color: ${TEXT_PRIMARY};
        }

        /* Scroll reveal */
        .reveal {
          opacity: 0;
          transform: translateY(26px);
          transition:
            opacity .7s ease,
            transform .7s ease;
        }

        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .lp-nav {
            padding: 0 24px;
          }

          .lp-nav-links {
            display: none;
          }

          .lp-features {
            padding: 72px 24px;
          }

          .lp-cta {
            padding: 80px 24px;
          }

          .lp-footer {
            padding: 28px 24px;
          }

          .lp-cards {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .lp-nav-right {
            gap: 10px;
          }

          .lp-signin {
            display: none;
          }

          .lp-hero {
            padding: 100px 20px 120px;
          }

          .lp-h1 {
            font-size: clamp(42px, 12vw, 60px);
          }

          .lp-subtitle {
            font-size: 15px;
            margin-bottom: 40px;
          }

          .lp-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="lp">
        {/* ── Navigation ── */}
        <nav className="lp-nav">
          <Link to="/" className="lp-logo">
            <Scale size={20} style={{ color: GOLD }} />
            <span>SUITS</span>
          </Link>

          <div className="lp-nav-links">
            <a
              href="#features"
              className="lp-nav-link active"
            >
              Features
            </a>

            <Link
              to="/search"
              className="lp-nav-link"
            >
              Research
            </Link>

            <Link
              to="/login"
              className="lp-nav-link"
            >
              Analytics
            </Link>
          </div>

          <div className="lp-nav-right">
            <Link
              to="/login"
              className="lp-signin"
            >
              Log In
            </Link>

            <Link
              to="/register"
              className="lp-btn lp-btn-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="lp-hero">
          <Reveal delay={0}>
            <div
              className="lp-hero-inner"
              ref={heroInnerRef}
            >
              <h1 className="lp-h1">
                Precision in Precedent.
                <span className="gold">
                  Intelligence in Every Case.
                </span>
              </h1>

              <p className="lp-subtitle">
                The modern AI workspace for advocates.
                Search, analyze, and manage case law
                with unprecedented speed and accuracy.
              </p>

              <Link
                to="/register"
                className="lp-btn lp-btn-lg"
              >
                Start Researching
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── Features ── */}
        <section
          className="lp-features"
          id="features"
        >
          <div className="lp-features-inner">
            <Reveal delay={0}>
              <h2 className="lp-section-title">
                Engineered for the Modern Practice
              </h2>

              <p className="lp-section-sub">
                Discover a suite of tools designed
                specifically for high-stakes legal workflows.
              </p>
            </Reveal>

            <div className="lp-cards">
              {[
                {
                  icon: <Search size={20} />,
                  title: "AI-Powered Search",
                  desc:
                    "Instant retrieval of judgments and precedents using advanced natural language processing tailored for legal contexts.",
                  delay: 100,
                },
                {
                  icon: <BarChart2 size={20} />,
                  title: "Workspace Analytics",
                  desc:
                    "Gain immediate visual insights into your case portfolio, track research hours, and monitor case status distributions seamlessly.",
                  delay: 200,
                },
                {
                  icon: <Bookmark size={20} />,
                  title: "Smart Bookmarking",
                  desc:
                    "Organise key cases, track timelines, and build a personalised repository of critical precedents for rapid access.",
                  delay: 300,
                },
              ].map(({ icon, title, desc, delay }) => (
                <Reveal
                  key={title}
                  delay={delay}
                >
                  <div className="lp-card">
                    <div className="lp-card-icon">
                      {icon}
                    </div>

                    <h3 className="lp-card-title">
                      {title}
                    </h3>

                    <p className="lp-card-desc">
                      {desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-cta">
          <Reveal delay={0}>
            <h2 className="lp-cta-title">
              Ready to elevate your practice?
            </h2>

            <span className="lp-cta-sub">
              Join the ranks of top advocates using AI
              to redefine legal research.
            </span>

            <Link
              to="/register"
              className="lp-btn lp-btn-lg"
            >
              Get Started Now
            </Link>
          </Reveal>
        </section>

        {/* ── Footer ── */}
        <footer className="lp-footer">
          <div className="lp-footer-brand">
            <Link
              to="/"
              className="lp-footer-logo"
            >
              <Scale
                size={15}
                style={{ color: GOLD }}
              />
              <span>SUITS</span>
            </Link>

            <span className="lp-footer-tagline">
              Precision in every precedent.
            </span>
          </div>

          <div className="lp-footer-links">
            {[
              "Privacy Policy",
              "Terms of Service",
              "Security",
              "Contact Support",
              "Newsletter",
            ].map((label) => (
              <a
                key={label}
                href="#"
                className="lp-footer-link"
              >
                {label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}

/* ── Intersection Observer Scroll Reveal ── */
function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.unobserve(el);
        }
      },
      {
        threshold: 0.1,
      }
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="reveal"
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}