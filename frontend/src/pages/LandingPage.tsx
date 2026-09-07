import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Shield,
  Zap,
  Search,
  CheckCircle2,
  Scale,
  Sparkles,
  ArrowRight,
  Mail,
  MessageSquare,
  Send,
  FileSearch,
  Brain,
  Bookmark,
  ChevronRight,
  User,
} from "lucide-react";

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("about");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [isLiquidMoving, setIsLiquidMoving] = useState(false);
  const prevActiveSection = useRef(activeSection);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;
      const sections = ["about", "mission", "how-it-works", "contact"];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updatePill = () => {
      const activeBtn = tabRefs.current[activeSection];
      const navEl = navRef.current;
      if (activeBtn && navEl) {
        const navRect = navEl.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        const newLeft = btnRect.left - navRect.left;
        const newWidth = btnRect.width;

        if (prevActiveSection.current !== activeSection) {
          setIsLiquidMoving(true);
          prevActiveSection.current = activeSection;
          setTimeout(() => setIsLiquidMoving(false), 450);
        }

        setPillStyle({
          left: newLeft,
          width: newWidth,
          opacity: 1,
        });
      }
    };

    updatePill();
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [activeSection]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 95;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        /* ===== EXACT DESIGN TOKENS & RESET FROM landing_page_aboutus.txt ===== */
        .lp-root {
          --bg: #0d1016;
          --panel: #171b23;
          --panel-light: #1b2029;
          --text: #f4f4f2;
          --muted: #aeb3bd;
          --gold: #e7b95f;
          --gold-light: #f3cb78;
          --border: rgba(255,255,255,0.08);

          min-height: 100vh;
          background:
            radial-gradient(circle at 80% 90%, rgba(185, 125, 40, 0.07), transparent 30%),
            var(--bg);
          color: var(--text);
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          position: relative;
          overflow-x: hidden;
        }

        /* FORCE SANS-SERIF ON ALL CHILDREN TO OVERRIDE INDEX.CSS SERIF */
        .lp-root,
        .lp-root * {
          box-sizing: border-box;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        }

        /* ---------------- NAVBAR (NO GLOW, CLEAN LIQUID GLASS WITH SWITCH ANIMATION) ---------------- */
        .lp-root header {
          height: 95px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4.2%;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(13, 16, 22, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .lp-root .logo {
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -1.5px;
          color: var(--text);
          text-decoration: none;
        }

        .lp-root .logo span {
          color: var(--gold);
        }

        /* Nav Glass Capsule (No glow, clean dark glassmorphism) */
        .lp-root .nav-glass {
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px;
          background: rgba(25, 29, 37, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 40px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 8px 30px rgba(0, 0, 0, 0.22);
        }

        /* Sliding Liquid Glass Droplet Indicator on Tab Switch */
        .lp-root .nav-liquid-pill {
          position: absolute;
          top: 6px;
          bottom: 6px;
          border-radius: 25px;
          background: rgba(105, 99, 91, 0.65);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.18);
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
          transition:
            left 0.44s cubic-bezier(0.22, 1, 0.36, 1.12),
            width 0.38s cubic-bezier(0.22, 1, 0.36, 1.12),
            opacity 0.2s ease;
        }

        /* Liquid droplet stretch / squash when switching tabs */
        .lp-root .nav-liquid-pill.is-liquid-flowing {
          animation: liquidDropletSquash 0.44s cubic-bezier(0.22, 1, 0.36, 1.12);
        }

        /* Internal specular wave sweep across the liquid droplet */
        .lp-root .nav-liquid-pill::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 25px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 100%
          );
          opacity: 0;
          transform: translateX(-100%);
        }

        .lp-root .nav-liquid-pill.is-liquid-flowing::after {
          opacity: 1;
          animation: liquidRippleSweep 0.44s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes liquidDropletSquash {
          0% {
            transform: scale(1, 1);
          }
          35% {
            transform: scale(1.08, 0.92);
          }
          70% {
            transform: scale(0.97, 1.02);
          }
          100% {
            transform: scale(1, 1);
          }
        }

        @keyframes liquidRippleSweep {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        /* Nav Buttons */
        .lp-root .nav-item {
          position: relative;
          z-index: 2;
          color: #e4e4e3;
          text-decoration: none;
          font-size: 14px;
          padding: 11px 19px;
          border-radius: 25px;
          transition: color 0.25s ease;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .lp-root .nav-item:hover {
          color: #ffffff;
        }

        .lp-root .nav-item.active {
          color: #ffffff;
          font-weight: 500;
        }

        .lp-root .nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lp-root .login {
          border: none;
          background: #dcb568;
          color: #151515 !important;
          font-size: 15px;
          font-weight: 500;
          padding: 12px 25px;
          border-radius: 28px;
          cursor: pointer;
          margin-left: 2px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .lp-root .login:hover {
          background: var(--gold-light);
        }

        /* ---------------- MAIN ---------------- */
        .lp-root main {
          width: 92%;
          max-width: 1535px;
          margin: 0 auto;
          padding-top: 95px;
        }

        /* ---------------- HERO (EXACT UNZOOMED FIT FROM HEAD.JPEG) ---------------- */
        .lp-root .hero {
          min-height: 485px;
          border-radius: 32px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background-color: #0d1016;
          background-image:
            linear-gradient(
              90deg,
              #0d1016 0%,
              #0d1016 44%,
              rgba(13, 16, 22, 0.94) 52%,
              rgba(13, 16, 22, 0.45) 64%,
              rgba(13, 16, 22, 0) 78%
            ),
            url("/legal-bg.jpg");
          background-position: left top, right center;
          background-size: 100% 100%, auto 100%;
          background-repeat: no-repeat, no-repeat;
          box-shadow:
            0 15px 45px rgba(0, 0, 0, 0.20),
            inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .lp-root .hero-content {
          position: relative;
          z-index: 2;
          width: 53%;
          padding: 58px 0 40px 65px;
        }

        .lp-root .eyebrow {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #b7bbc2;
          font-size: 12px;
          letter-spacing: 4px;
          font-weight: 500;
          margin-bottom: 35px;
        }

        .lp-root .eyebrow::before {
          content: "";
          width: 34px;
          height: 2px;
          background: var(--gold);
          flex-shrink: 0;
        }

        .lp-root h1 {
          font-size: clamp(45px, 4.2vw, 62px) !important;
          line-height: 1.02 !important;
          letter-spacing: -2.5px !important;
          font-weight: 700 !important;
          margin: 0 0 24px 0 !important;
          color: var(--text) !important;
        }

        .lp-root h1 .gold {
          color: var(--gold-light) !important;
        }

        .lp-root .hero-description {
          max-width: 650px;
          color: #b7bbc3;
          font-size: 18px;
          line-height: 1.55;
          margin: 0 0 28px 0;
        }

        /* ---------------- BUTTONS ---------------- */
        .lp-root .buttons {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .lp-root .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          min-width: 238px;
          height: 62px;
          border-radius: 35px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: 0.25s ease;
          border: none;
          cursor: pointer;
        }

        .lp-root .btn-primary {
          color: #141414 !important;
          background: #efc66d;
        }

        .lp-root .btn-primary:hover {
          transform: translateY(-2px);
          background: #f5d27e;
        }

        .lp-root .arrow {
          font-size: 22px;
        }

        .lp-root .btn-secondary {
          color: white !important;
          background: rgba(20, 24, 31, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.13);
        }

        .lp-root .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.07);
        }

        .lp-root .keywords {
          margin-top: 32px;
          display: flex;
          align-items: center;
          gap: 17px;
          color: #a7acb5;
          font-size: 11px;
          letter-spacing: 3px;
        }

        .lp-root .keywords span:not(:last-child)::after {
          content: "/";
          margin-left: 17px;
          color: #70757e;
        }

        /* ---------------- FEATURES (DOT TO DOT) ---------------- */
        .lp-root .features {
          margin-top: 22px;
          min-height: 180px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: rgba(23, 27, 35, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.065);
          border-radius: 30px;
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          overflow: hidden;
        }

        .lp-root .feature {
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 32px 42px;
          position: relative;
        }

        .lp-root .feature:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 0;
          top: 35px;
          bottom: 35px;
          width: 1px;
          background: rgba(255, 255, 255, 0.08);
        }

        .lp-root .feature-icon {
          flex: 0 0 82px;
          width: 82px;
          height: 82px;
          display: grid;
          place-items: center;
          border-radius: 25px;
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.055),
              rgba(255, 255, 255, 0.015)
            );
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--gold-light);
          font-size: 35px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .lp-root .feature h3 {
          font-size: 17px !important;
          margin: 0 0 10px 0 !important;
          white-space: nowrap;
          font-weight: 600 !important;
          color: var(--text) !important;
        }

        .lp-root .feature p {
          color: #aeb3bd;
          font-size: 15px;
          line-height: 1.45;
          margin: 0;
        }

        /* ---------------- BOTTOM STATEMENT (DOT TO DOT) ---------------- */
        .lp-root .closing {
          text-align: center;
          padding: 30px 20px 35px;
        }

        .lp-root .closing-line {
          width: 35px;
          height: 2px;
          background: var(--gold);
          margin: 0 auto 18px;
        }

        .lp-root .closing h2 {
          font-size: 26px !important;
          letter-spacing: -0.7px !important;
          font-weight: 700 !important;
          color: var(--text) !important;
          margin: 0 !important;
        }

        .lp-root .closing h2 span {
          color: var(--gold-light) !important;
        }

        .lp-root .closing p {
          margin-top: 10px;
          color: #9fa5af;
          font-size: 15px;
          margin-bottom: 0;
        }

        /* ---------------- SUBSEQUENT SECTIONS (MISSION, HOW IT WORKS, CONTACT) ---------------- */
        .lp-root .glass-card {
          background: rgba(23, 27, 35, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.065);
          border-radius: 30px;
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.20);
        }

        .lp-root .glass-card-hover:hover {
          border-color: rgba(231, 185, 95, 0.28);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
        }

        .lp-root .section-title {
          font-size: 34px !important;
          font-weight: 700 !important;
          letter-spacing: -1.2px !important;
          color: var(--text) !important;
          line-height: 1.2 !important;
        }

        .lp-root .section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--gold);
          font-size: 12px;
          letter-spacing: 3px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .lp-root .section-eyebrow::before,
        .lp-root .section-eyebrow::after {
          content: "";
          width: 20px;
          height: 1.5px;
          background: var(--gold);
        }

        .lp-root .sub-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gold-light);
          flex-shrink: 0;
        }

        /* ---------------- RESPONSIVE (FROM REFERENCE CODE) ---------------- */
        @media (max-width: 1100px) {
          .lp-root header {
            padding: 0 25px;
          }

          .lp-root .hero-content {
            width: 65%;
            padding-left: 45px;
          }

          .lp-root .features {
            grid-template-columns: repeat(2, 1fr);
          }

          .lp-root .feature:nth-child(2)::after {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .lp-root header {
            height: 80px;
          }

          .lp-root .nav-glass {
            display: none;
          }

          .lp-root .logo {
            font-size: 24px;
          }

          .lp-root main {
            width: 94%;
          }

          .lp-root .hero {
            min-height: 600px;
            background:
              linear-gradient(
                180deg,
                rgba(13, 16, 22, 0.96) 0%,
                rgba(13, 16, 22, 0.90) 60%,
                rgba(13, 16, 22, 0.72) 100%
              ),
              url("/legal-bg.jpg") center / cover no-repeat;
          }

          .lp-root .hero-content {
            width: 100%;
            padding: 45px 30px;
          }

          .lp-root h1 {
            font-size: 44px !important;
          }

          .lp-root .hero-description {
            font-size: 16px;
          }

          .lp-root .buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .lp-root .btn {
            width: 100%;
          }

          .lp-root .features {
            grid-template-columns: 1fr;
          }

          .lp-root .feature {
            padding: 28px;
          }

          .lp-root .feature:not(:last-child)::after {
            top: auto;
            bottom: 0;
            left: 28px;
            right: 28px;
            width: auto;
            height: 1px;
          }
        }
      `}</style>

      <div className="lp-root">
        {/* ==================== NAVBAR ==================== */}
        <header>
          <Link to="/" className="logo">
            SUITS<span>.</span>
          </Link>

          <nav className="nav-glass" ref={navRef}>
            {/* Sliding Liquid Glass Droplet Indicator */}
            <div
              className={`nav-liquid-pill ${isLiquidMoving ? "is-liquid-flowing" : ""}`}
              style={{
                left: `${pillStyle.left}px`,
                width: `${pillStyle.width}px`,
                opacity: pillStyle.opacity,
              }}
            />

            <button
              ref={(el) => { tabRefs.current["about"] = el; }}
              onClick={() => scrollTo("about")}
              className={`nav-item ${activeSection === "about" ? "active" : ""}`}
            >
              About Us
            </button>

            <button
              ref={(el) => { tabRefs.current["mission"] = el; }}
              onClick={() => scrollTo("mission")}
              className={`nav-item ${activeSection === "mission" ? "active" : ""}`}
            >
              Our Mission
            </button>

            <button
              ref={(el) => { tabRefs.current["how-it-works"] = el; }}
              onClick={() => scrollTo("how-it-works")}
              className={`nav-item ${activeSection === "how-it-works" ? "active" : ""}`}
            >
              How It Works
            </button>

            <button
              ref={(el) => { tabRefs.current["contact"] = el; }}
              onClick={() => scrollTo("contact")}
              className={`nav-item ${activeSection === "contact" ? "active" : ""}`}
            >
              Get In Touch
            </button>
          </nav>

          <div className="nav-right">
            <Link to="/login" className="login">
              Login
            </Link>
          </div>
        </header>

        {/* ==================== MAIN ==================== */}
        <main>
          {/* ============================================================
              SECTION 1: ABOUT US (DOT TO DOT IMPLEMENTATION OF CODE & IMAGE)
             ============================================================ */}
          <section id="about" style={{ scrollMarginTop: 115 }}>
            {/* HERO */}
            <section className="hero">
              <div className="hero-content">
                <div className="eyebrow">
                  LAW · PEOPLE · A FAIRER TOMORROW
                </div>

                <h1>
                  Legal knowledge<br />
                  <span className="gold">
                    for a more equal society.
                  </span>
                </h1>

                <p className="hero-description">
                  SUITS. helps you understand legal processes,
                  access reliable information, and make informed
                  decisions — all in one place.
                </p>

                <div className="buttons">
                  <Link to="/register" className="btn btn-primary">
                    Get Started
                    <span className="arrow">→</span>
                  </Link>

                  <button
                    onClick={() => scrollTo("mission")}
                    className="btn btn-secondary"
                  >
                    Learn More
                  </button>
                </div>

                <div className="keywords">
                  <span>UNDERSTAND</span>
                  <span>ACCESS</span>
                  <span>EMPOWER</span>
                </div>
              </div>
            </section>

            {/* FEATURES */}
            <section className="features">
              <article className="feature">
                <div className="feature-icon">
                  <BookOpen size={36} strokeWidth={1.75} />
                </div>
                <div>
                  <h3>Reliable Information</h3>
                  <p>
                    Access simplified and<br />
                    trusted legal resources.
                  </p>
                </div>
              </article>

              <article className="feature">
                <div className="feature-icon">
                  <Users size={36} strokeWidth={1.75} />
                </div>
                <div>
                  <h3>For Everyone</h3>
                  <p>
                    Designed for students,<br />
                    professionals and curious<br />
                    minds alike.
                  </p>
                </div>
              </article>

              <article className="feature">
                <div className="feature-icon">
                  <Shield size={36} strokeWidth={1.75} />
                </div>
                <div>
                  <h3>Build Confidence</h3>
                  <p>
                    Understand your rights<br />
                    and options with clarity.
                  </p>
                </div>
              </article>

              <article className="feature">
                <div className="feature-icon">
                  <Zap size={36} strokeWidth={1.75} fill="currentColor" />
                </div>
                <div>
                  <h3>Make Better Decisions</h3>
                  <p>
                    Knowledge today,<br />
                    a fairer tomorrow.
                  </p>
                </div>
              </article>
            </section>

            {/* CLOSING */}
            <section className="closing">
              <div className="closing-line"></div>
              <h2>
                Justice begins with{" "}
                <span>understanding.</span>
              </h2>
              <p>
                SUITS. is your step towards a more informed,
                empowered and equal tomorrow.
              </p>
            </section>
          </section>

          {/* ============================================================
              SECTION 2: OUR MISSION (MATCHING OM.jpeg & SINGLE-PAGE SCROLL)
             ============================================================ */}
          <section
            id="mission"
            className="space-y-6"
            style={{ scrollMarginTop: 115, marginTop: 40 }}
          >
            <div className="glass-card p-8 sm:p-12 md:p-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                <div className="lg:col-span-6 lg:border-r lg:border-[rgba(255,255,255,0.08)] lg:pr-10 space-y-6">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-[1.5px] bg-[#e7b95f] inline-block" />
                    <span className="text-[11.5px] tracking-[0.16em] uppercase font-semibold text-[#e7b95f]">
                      OUR MISSION
                    </span>
                  </div>

                  <h2 className="section-title">
                    Knowledge today.{" "}
                    <span style={{ color: "var(--gold-light)", display: "block" }}>
                      A fairer tomorrow.
                    </span>
                  </h2>

                  <p className="text-[15px] sm:text-[15.5px] leading-[1.7] text-[#98A1B2]">
                    At SUITS., our mission is to make legal knowledge accessible,
                    understandable, and useful for everyone — breaking down
                    barriers between the law and the people it serves.
                  </p>

                  <div className="pt-2">
                    <span className="text-[10.5px] tracking-[0.22em] uppercase font-medium text-[#70757e]">
                      PEOPLE &nbsp;/&nbsp; KNOWLEDGE &nbsp;/&nbsp; ACCESS &nbsp;/&nbsp; EQUAL OPPORTUNITY
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-6 lg:pl-6">
                  <div className="flex items-start gap-5 p-3 rounded-2xl hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="sub-icon"><BookOpen size={22} /></div>
                    <div className="space-y-1">
                      <h3 className="text-[17px] font-semibold text-white">Educate</h3>
                      <p className="text-[14px] text-[#8E95A5] leading-relaxed">
                        Simplify complex legal concepts for everyone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5 p-3 rounded-2xl hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="sub-icon"><Users size={22} /></div>
                    <div className="space-y-1">
                      <h3 className="text-[17px] font-semibold text-white">Empower</h3>
                      <p className="text-[14px] text-[#8E95A5] leading-relaxed">
                        Give individuals the confidence to make informed decisions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5 p-3 rounded-2xl hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="sub-icon"><Shield size={22} /></div>
                    <div className="space-y-1">
                      <h3 className="text-[17px] font-semibold text-white">Create Change</h3>
                      <p className="text-[14px] text-[#8E95A5] leading-relaxed">
                        Build a more equal, transparent and just society.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 sm:p-10 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-center">
                <div className="lg:col-span-5 lg:border-r lg:border-[rgba(255,255,255,0.08)] lg:pr-10 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-[1.5px] bg-[#e7b95f] inline-block" />
                    <span className="text-[11.5px] tracking-[0.16em] uppercase font-semibold text-[#8E95A5]">
                      WHY IT MATTERS
                    </span>
                  </div>

                  <h3 className="text-[28px] sm:text-[34px] md:text-[38px] font-bold leading-[1.18] tracking-[-0.02em] text-white">
                    An informed society{" "}
                    <span style={{ color: "var(--gold-light)", display: "block" }}>
                      creates real change.
                    </span>
                  </h3>
                </div>

                <div className="lg:col-span-7 lg:pl-6">
                  <p className="text-[15px] sm:text-[15.5px] leading-[1.74] text-[#98A1B2]">
                    The law touches every part of our lives. Yet, for many, it
                    remains confusing and out of reach. Our mission is to bridge
                    that gap — because when more people understand the law,
                    communities become stronger, fairer, and more resilient.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================
              SECTION 3: HOW IT WORKS (ENHANCED)
             ============================================================ */}
          <section
            id="how-it-works"
            className="space-y-8"
            style={{ scrollMarginTop: 115, marginTop: 50 }}
          >
            <div className="text-center space-y-3.5 max-w-[700px] mx-auto">
              <div className="section-eyebrow">HOW IT WORKS</div>
              <h2 className="section-title">
                Empowering every step of your legal journey.
              </h2>
              <p className="text-[15px] text-[#8E95A5] leading-relaxed">
                From finding a precedent to understanding your fundamental rights,
                SUITS makes legal intelligence clear and accessible.
              </p>
            </div>

            {/* Workflow Overview Card */}
            <div className="glass-card p-8 sm:p-10 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-[1.5px] bg-[#e7b95f] inline-block" />
                    <span className="text-[11.5px] tracking-[0.16em] uppercase font-semibold text-[#e7b95f]">
                      PLATFORM OVERVIEW
                    </span>
                  </div>
                  <h3 className="text-[26px] sm:text-[30px] font-bold leading-[1.2] tracking-[-0.02em] text-white">
                    AI-powered legal research,{" "}
                    <span style={{ color: "var(--gold-light)" }}>simplified.</span>
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-[#98A1B2]">
                    SUITS is an intelligent legal research platform that combines court case databases
                    with AI analysis. Search across Indian Supreme Court and High Court judgments,
                    get plain-language summaries of complex legal documents, and organize your
                    research — all from a single, intuitive workspace.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {["Case Search", "AI Summaries", "Legal Analytics", "Document Reader", "Research Workspace"].map((tag) => (
                      <span
                        key={tag}
                        className="text-[12px] tracking-wider font-medium text-[#a7acb5] px-3.5 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Visual Flow Diagram */}
                <div className="space-y-4">
                  {[
                    { icon: <FileSearch size={20} />, label: "Search a case or legal topic", desc: "Type in plain English — no legal jargon needed" },
                    { icon: <Brain size={20} />, label: "AI analyzes the documents", desc: "Extracts key holdings, citations, and principles" },
                    { icon: <Bookmark size={20} />, label: "Save & organize findings", desc: "Bookmark cases to your personal workspace" },
                    { icon: <Scale size={20} />, label: "Make informed decisions", desc: "Act with clarity backed by real legal data" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(231,185,95,0.2)] transition-colors">
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[11px] font-mono font-bold text-[#e7b95f] w-5 text-center">{i + 1}</span>
                        <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#f3cb78]">
                          {item.icon}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[15px] font-semibold text-white">{item.label}</h4>
                        <p className="text-[13px] text-[#8E95A5] leading-relaxed mt-0.5">{item.desc}</p>
                      </div>
                      {i < 3 && <ChevronRight size={16} className="text-[#70757e] flex-shrink-0 mt-2.5 hidden sm:block" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3 Step Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              <div className="glass-card glass-card-hover p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <span className="text-[12px] font-mono tracking-wider font-semibold text-[#e7b95f] px-3 py-1 rounded-md bg-[rgba(231,185,95,0.1)] border border-[rgba(231,185,95,0.2)] inline-block">
                    STEP 01
                  </span>
                  <div className="sub-icon"><Search size={22} /></div>
                  <h3 className="text-[19px] font-semibold text-white">Search & Discover</h3>
                  <p className="text-[14px] text-[#8E95A5] leading-relaxed">
                    Search acts, judgments, and legal questions using ordinary, conversational language. No legal jargon required.
                  </p>
                  <ul className="space-y-2 text-[13px] text-[#8E95A5]">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> Search by case name, CNR, or topic</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> Filter by court, date, or bench</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> Voice-powered dictation support</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-[#70757e] pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <CheckCircle2 size={15} className="text-[#e7b95f]" />
                  <span>Indian Supreme Court & High Court cases</span>
                </div>
              </div>

              <div className="glass-card glass-card-hover p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <span className="text-[12px] font-mono tracking-wider font-semibold text-[#e7b95f] px-3 py-1 rounded-md bg-[rgba(231,185,95,0.1)] border border-[rgba(231,185,95,0.2)] inline-block">
                    STEP 02
                  </span>
                  <div className="sub-icon"><Sparkles size={22} /></div>
                  <h3 className="text-[19px] font-semibold text-white">Analyze & Understand</h3>
                  <p className="text-[14px] text-[#8E95A5] leading-relaxed">
                    AI synthesizes hundreds of pages into crisp ratio decidendi, key citations, and understandable legal principles.
                  </p>
                  <ul className="space-y-2 text-[13px] text-[#8E95A5]">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> AI-generated case summaries</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> Citation network & cross-references</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> Statute-linked legal analysis</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-[#70757e] pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <CheckCircle2 size={15} className="text-[#e7b95f]" />
                  <span>Plain-language summaries & statutory links</span>
                </div>
              </div>

              <div className="glass-card glass-card-hover p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <span className="text-[12px] font-mono tracking-wider font-semibold text-[#e7b95f] px-3 py-1 rounded-md bg-[rgba(231,185,95,0.1)] border border-[rgba(231,185,95,0.2)] inline-block">
                    STEP 03
                  </span>
                  <div className="sub-icon"><Scale size={22} /></div>
                  <h3 className="text-[19px] font-semibold text-white">Act with Confidence</h3>
                  <p className="text-[14px] text-[#8E95A5] leading-relaxed">
                    Bookmark findings, export structured legal binders, and proceed with backed citations and strategic clarity.
                  </p>
                  <ul className="space-y-2 text-[13px] text-[#8E95A5]">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> Personal research dashboard</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> Bookmark & organize cases</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#e7b95f] flex-shrink-0" /> Analytics & trend insights</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-[#70757e] pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <CheckCircle2 size={15} className="text-[#e7b95f]" />
                  <span>Personalized workspace & case management</span>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================
              SECTION 4: GET IN TOUCH (WITH CONTACT FORM)
             ============================================================ */}
          <section
            id="contact"
            style={{ scrollMarginTop: 115, marginTop: 50 }}
          >
            <div className="glass-card p-9 sm:p-12 md:p-16 relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 relative z-10">
                {/* Left Column: Info */}
                <div className="space-y-8">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-[1.5px] bg-[#e7b95f] inline-block" />
                      <span className="text-[11.5px] tracking-[0.16em] uppercase font-semibold text-[#e7b95f]">
                        GET IN TOUCH
                      </span>
                    </div>
                    <h2 className="section-title">
                      Have a question?{" "}
                      <span style={{ color: "var(--gold-light)" }}>We'd love to hear from you.</span>
                    </h2>
                    <p className="text-[15px] leading-[1.7] text-[#98A1B2]">
                      Whether you're a law student, legal professional, or just curious about
                      your rights — reach out and we'll get back to you as soon as possible.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="sub-icon"><Mail size={20} /></div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-white">Email Us</h4>
                        <p className="text-[13.5px] text-[#8E95A5]">support@suits.legal</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="sub-icon"><MessageSquare size={20} /></div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-white">Live Chat</h4>
                        <p className="text-[13.5px] text-[#8E95A5]">Available Mon–Fri, 9 AM – 6 PM IST</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/register"
                      className="btn btn-primary !h-[48px] !min-w-[180px] !text-[14px]"
                    >
                      <span>Get Started Free</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/login"
                      className="btn btn-secondary !h-[48px] !min-w-[180px] !text-[14px]"
                    >
                      <span>Log In</span>
                    </Link>
                  </div>
                </div>

                {/* Right Column: Contact Form */}
                <div className="space-y-5">
                  {formSubmitted ? (
                    <div className="p-8 rounded-2xl bg-[rgba(231,185,95,0.06)] border border-[rgba(231,185,95,0.25)] text-center space-y-4 py-12">
                      <div className="w-14 h-14 rounded-full bg-[rgba(231,185,95,0.15)] text-[#f3cb78] mx-auto flex items-center justify-center">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-[20px] font-bold text-white">Message Received!</h4>
                      <p className="text-[14px] text-[#b7bbc2] max-w-md mx-auto leading-relaxed">
                        Thank you for getting in touch. Our legal research team has received your query and will respond to your email shortly.
                      </p>
                      <button
                        onClick={() => setFormSubmitted(false)}
                        className="btn btn-secondary !text-[13px] !h-[40px] !px-5 mt-2"
                      >
                        Send Another Query
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setFormSubmitted(true);
                      }}
                      className="space-y-4"
                    >
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#b7bbc2] flex items-center gap-1.5">
                          <User size={13} /> Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="Your full name"
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-[14px] placeholder-[#70757e] outline-none focus:border-[rgba(231,185,95,0.5)] transition-colors"
                          style={{ fontFamily: "inherit" }}
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#b7bbc2] flex items-center gap-1.5">
                          <Mail size={13} /> Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-[14px] placeholder-[#70757e] outline-none focus:border-[rgba(231,185,95,0.5)] transition-colors"
                          style={{ fontFamily: "inherit" }}
                        />
                      </div>

                      {/* Subject */}
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#b7bbc2] flex items-center gap-1.5">
                          <FileSearch size={13} /> Subject / Inquiry Type
                        </label>
                        <select
                          name="subject"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-[14px] outline-none focus:border-[rgba(231,185,95,0.5)] transition-colors appearance-none cursor-pointer"
                          style={{ fontFamily: "inherit" }}
                          defaultValue=""
                        >
                          <option value="" disabled style={{ background: "#171b23", color: "#70757e" }}>Select a topic</option>
                          <option value="general" style={{ background: "#171b23" }}>General Inquiry</option>
                          <option value="feedback" style={{ background: "#171b23" }}>Feedback & Suggestions</option>
                          <option value="bug" style={{ background: "#171b23" }}>Report an Issue</option>
                          <option value="partnership" style={{ background: "#171b23" }}>Partnership / Collaboration</option>
                          <option value="other" style={{ background: "#171b23" }}>Other</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#b7bbc2] flex items-center gap-1.5">
                          <MessageSquare size={13} /> Your Query / Message
                        </label>
                        <textarea
                          name="message"
                          required
                          rows={4}
                          placeholder="Describe your legal query or question here..."
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-[14px] placeholder-[#70757e] outline-none focus:border-[rgba(231,185,95,0.5)] transition-colors resize-none"
                          style={{ fontFamily: "inherit" }}
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="btn btn-primary !h-[52px] w-full !text-[15px] mt-2"
                      >
                        <Send size={17} />
                        <span>Send Message</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Decorative radial overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-[rgba(231,185,95,0.04)] to-[rgba(62,124,166,0.04)] rounded-full blur-3xl pointer-events-none" />
            </div>
          </section>
        </main>

        {/* ==================== FOOTER ==================== */}
        <footer className="relative z-10 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(13,16,22,0.94)] mt-16 py-10 px-6 sm:px-12">
          <div className="w-[92%] max-w-[1535px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
              <span className="text-[21px] font-bold tracking-tight text-white flex items-center" style={{ letterSpacing: "-1.5px" }}>
                SUITS<span style={{ color: "var(--gold)", fontSize: "26px", lineHeight: "1", marginLeft: "1px" }}>.</span>
              </span>
              <span className="text-[12.5px] text-[#70757e]">
                &copy; {new Date().getFullYear()} SUITS. Precision in precedent, intelligence in every case.
              </span>
            </div>

            <div className="flex items-center gap-7 text-[13.5px] text-[#8E95A5] flex-wrap justify-center">
              <button
                onClick={() => scrollTo("about")}
                className="hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 text-[#8E95A5]"
              >
                About Us
              </button>
              <button
                onClick={() => scrollTo("mission")}
                className="hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 text-[#8E95A5]"
              >
                Our Mission
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 text-[#8E95A5]"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollTo("contact")}
                className="hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 text-[#8E95A5]"
              >
                Get In Touch
              </button>
              <Link to="/login" className="hover:text-white transition-colors text-[#8E95A5] text-decoration-none">
                Workspace
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}