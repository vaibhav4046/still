"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRightIcon, MenuIcon, ShieldIcon } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -16px 0px" },
    );
    for (const node of nodes) {
      observer.observe(node);
    }
    return () => observer.disconnect();
  });

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark">
              <ShieldIcon size={16} />
            </span>
            <span>
              <strong>STILL</strong>
              <small>continuity control room</small>
            </span>
          </Link>

          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <MenuIcon />
          </button>

          <nav aria-label="Primary navigation" className={`main-nav${menuOpen ? " main-nav-open" : ""}`}>
            <Link href="/#product" onClick={() => setMenuOpen(false)}>
              Product
            </Link>
            <Link href="/#try-it" onClick={() => setMenuOpen(false)}>
              Live demo
            </Link>
            <Link href="/#evidence" onClick={() => setMenuOpen(false)}>
              Evidence
            </Link>
          </nav>

          <div className="topbar-right">
            <span className="topbar-note" title="Synthetic university advising environment">
              <span className="pulse-dot" /> synthetic environment
            </span>
            <Link className="topbar-cta" href="/#demo-film" onClick={() => setMenuOpen(false)}>
              Watch it recover <ArrowUpRightIcon size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="footer-copy">
          <strong>STILL · Civic &amp; Campus Appointment Continuity</strong>
          <span>
            Authoritative booking state is persisted in Neon PostgreSQL with HMAC-SHA256 capability readback. All demo
            services and bookings use clearly labelled synthetic data.
          </span>
        </div>
        <nav aria-label="Legal and verification links" className="footer-links">
          <Link href="/book">Primary (/book)</Link>
          <Link href="/simple">Accessible Fallback (/simple)</Link>
          <Link href="/privacy">Privacy &amp; Data Notice</Link>
          <Link href="/terms">Terms &amp; MIT License</Link>
          <a href="/health" rel="noopener noreferrer" target="_blank">
            Live /health JSON
          </a>
          <a href="https://gitlab.com/vaibhav.lalwani/still" rel="noopener noreferrer" target="_blank">
            GitLab Repository
          </a>
        </nav>
      </footer>
    </div>
  );
}
