import { useRef, useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";

interface SiriWaveOrbProps {
  audioLevel?: number; // 0.0 to 1.0
  width?: number;
  height?: number;
  isListening?: boolean;
}

// Theme-aware secondary colour tokens:
// Light Mode: Vibrant slate/azure blue (matches Suits light accent #3E7CA6)
// Dark Mode: Radiant warm amber/orange (matches Suits dark accent #C4A06D / #F58220)
const THEME_COLORS = {
  light: {
    primary:   [62, 124, 166],   // Slate blue #3E7CA6
    secondary: [44, 145, 205],   // Azure blue
    highlight: [90, 175, 230],   // Bright light blue shimmer
  },
  dark: {
    primary:   [245, 130, 32],   // Radiant warm orange #F58220
    secondary: [230, 105, 20],   // Deep amber-orange
    highlight: [255, 185, 75],   // Luminous golden-orange crest
  },
};

export function SiriWaveOrb({
  audioLevel = 0,
  width = 120,
  height = 42,
  isListening = true,
}: SiriWaveOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const tRef = useRef<number>(0);
  const smoothedRef = useRef<number>(0);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const cy = height / 2;
    const palette = THEME_COLORS[theme];

    const rgba = (rgb: number[], alpha: number) =>
      `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;

    interface LayerDef {
      frequency: number;
      speed:     number;
      phase:     number;
      baseAmp:   number;
      maxAmp:    number;
      lineWidth: number;
      baseAlpha: number;
      maxAlpha:  number;
      rgb:       number[];
    }

    const layers: LayerDef[] = [
      // Layer 1 — thick base wave, primary blue/orange
      {
        frequency: 1.5,
        speed:     0.012,
        phase:     0,
        baseAmp:   height * 0.07,
        maxAmp:    height * 0.36,
        lineWidth: 2.6,
        baseAlpha: 0.85,
        maxAlpha:  1.0,
        rgb:       palette.primary,
      },
      // Layer 2 — medium harmonic wave, secondary blue/orange
      {
        frequency: 2.2,
        speed:     -0.009,
        phase:     Math.PI * 0.7,
        baseAmp:   height * 0.045,
        maxAmp:    height * 0.28,
        lineWidth: 1.6,
        baseAlpha: 0.60,
        maxAlpha:  0.85,
        rgb:       palette.secondary,
      },
      // Layer 3 — thin fast reactive detail, highlight blue/orange
      {
        frequency: 3.0,
        speed:     0.018,
        phase:     Math.PI * 1.4,
        baseAmp:   height * 0.028,
        maxAmp:    height * 0.20,
        lineWidth: 1.0,
        baseAlpha: 0.45,
        maxAlpha:  0.75,
        rgb:       palette.highlight,
      },
    ];

    const drawLayer = (layer: LayerDef, lvl: number, t: number) => {
      const amp   = layer.baseAmp + lvl * (layer.maxAmp - layer.baseAmp);
      const alpha = layer.baseAlpha + lvl * (layer.maxAlpha - layer.baseAlpha);
      const angle = t * layer.speed * Math.PI * 2 + layer.phase;

      // Sample points across width
      const steps = Math.ceil(width * 1.5);
      const pts: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const x    = (i / steps) * width;
        const normX = x / width;
        // Bell envelope: 0 at edges → 1 at centre → 0 at edges
        const env  = Math.sin(normX * Math.PI);
        const θ    = normX * Math.PI * 2 * layer.frequency + angle;
        pts.push([x, cy + Math.sin(θ) * amp * env]);
      }

      // Smooth bezier through midpoints
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);

      ctx.save();
      // Luminous neon glow along the wave lines
      ctx.shadowColor = rgba(layer.rgb, 0.45 + lvl * 0.35);
      ctx.shadowBlur = 4 + lvl * 6;
      ctx.strokeStyle = rgba(layer.rgb, alpha);
      ctx.lineWidth   = layer.lineWidth;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Smooth audio level
      const target = isListening ? Math.max(audioLevel, 0.04) : 0.0;
      smoothedRef.current += (target - smoothedRef.current) * 0.13;
      const lvl = smoothedRef.current;

      tRef.current += 1;
      const t = tRef.current;

      ctx.globalCompositeOperation = "source-over";
      for (const layer of layers) {
        drawLayer(layer, lvl, t);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioLevel, isListening, width, height, theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: "block" }}
    />
  );
}
