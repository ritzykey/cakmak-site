"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { CALLOUTS, SECTIONS, type CalloutId } from "@/lib/content";
import { calloutEls, scrollState } from "@/lib/store";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="loading">Çakmak hazırlanıyor…</div>,
});

const IDS = Object.keys(CALLOUTS) as CalloutId[];

function Callouts() {
  return (
    <div className="callouts" aria-hidden="true">
      <svg className="callout-svg">
        {IDS.map((id) => (
          <g key={id}>
            <line
              className="callout-line"
              style={{ opacity: 0 }}
              ref={(el) => {
                if (!el) return;
                const cur = calloutEls.get(id) ?? ({} as never);
                calloutEls.set(id, { ...cur, line: el });
              }}
            />
            <circle
              className="callout-ring"
              r={9}
              style={{ opacity: 0 }}
              ref={(el) => {
                if (!el) return;
                const cur = calloutEls.get(id) ?? ({} as never);
                calloutEls.set(id, { ...cur, ring: el });
              }}
            />
            <circle
              className="callout-dot"
              r={3.5}
              style={{ opacity: 0 }}
              ref={(el) => {
                if (!el) return;
                const cur = calloutEls.get(id) ?? ({} as never);
                calloutEls.set(id, { ...cur, dot: el });
              }}
            />
          </g>
        ))}
      </svg>
      {IDS.map((id) => (
        <div
          key={id}
          className="callout-label"
          style={{ opacity: 0 }}
          ref={(el) => {
            if (!el) return;
            const cur = calloutEls.get(id) ?? ({} as never);
            calloutEls.set(id, { ...cur, label: el });
          }}
        >
          <strong>{CALLOUTS[id].title}</strong>
          <span>{CALLOUTS[id].text}</span>
        </div>
      ))}
    </div>
  );
}

export default function LighterExperience() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollState.p = max > 0 ? window.scrollY / max : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${scrollState.p})`;
    };
    // Sayfa her açıldığında en baştan (kapalı çakmak) başlasın
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <div className="stage">
        <Scene />
      </div>
      <Callouts />
      <div className="progress">
        <div ref={bar} className="progress-bar" />
      </div>
      <header className="topbar">
        <span className="brand">ÇAKMAK</span>
        <span className="hint">Kaydır ↓</span>
      </header>
      <main className="sections">
        {SECTIONS.map((s, i) => (
          <section key={i} className={`section align-${s.align}`}>
            <div className="panel">
              <p className="eyebrow">{s.eyebrow}</p>
              {i === 0 ? <h1>{s.title}</h1> : <h2>{s.title}</h2>}
              <p className="text">{s.text}</p>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
