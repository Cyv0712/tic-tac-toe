"use client";

import { useEffect, useRef } from "react";
import type { Mark } from "@/lib/game";

type Props = {
  /** Changing `id` fires a new burst. Null means no burst. */
  burst: { id: number; winner: Mark } | null;
};

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  color: string;
  round: boolean;
};

const DURATION_MS = 2600;
const PIECES = 150;

export function Confetti({ burst }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!burst || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    el.width = width * dpr;
    el.height = height * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    const tube = css.getPropertyValue(burst.winner === "X" ? "--x" : "--o").trim();
    const palette = [
      tube,
      tube,
      css.getPropertyValue("--draw").trim(),
      css.getPropertyValue("--ink").trim(),
    ];

    const pieces: Piece[] = Array.from({ length: PIECES }, () => {
      // Fire upward in a wide fan from just above the middle of the screen.
      const heading = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const speed = 7 + Math.random() * 11;
      return {
        x: width / 2,
        y: height * 0.45,
        vx: Math.cos(heading) * speed,
        vy: Math.sin(heading) * speed,
        size: 5 + Math.random() * 6,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.4,
        color: palette[Math.floor(Math.random() * palette.length)],
        round: Math.random() < 0.3,
      };
    });

    let frame = 0;
    let last = performance.now();
    const start = last;

    const tick = (now: number) => {
      const elapsed = now - start;
      const step = Math.min((now - last) / 16.67, 3); // 1 = one 60fps frame
      last = now;
      ctx.clearRect(0, 0, width, height);
      const fade = Math.max(0, 1 - Math.max(0, elapsed - 1800) / (DURATION_MS - 1800));

      for (const p of pieces) {
        p.vy += 0.34 * step;
        p.vx *= Math.pow(0.99, step);
        p.vy *= Math.pow(0.992, step);
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.angle += p.spin * step;

        ctx.save();
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }

      if (elapsed < DURATION_MS) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
    };
  }, [burst]);

  return <canvas ref={canvas} className="confetti" aria-hidden />;
}
