import { useEffect, useRef } from "react";

export type PencilShadowShape = "pill" | "circle" | "rect";

export interface PencilShadowOptions {
  /** Pixel offset of shadow from element. Default: 7 */
  offset?: number;
  /** Gap between hatch lines in px. Default: 4 */
  spacing?: number;
  /** How much each line wiggles. Default: 1.5 */
  wobble?: number;
  /** Base opacity of lines (0–1). Default: 0.55 */
  opacity?: number;
  /** Stroke width of each line. Default: 0.7 */
  lineWidth?: number;
  /** Hatch angle in degrees. Default: 45 */
  angle?: number;
  /** How much opacity varies per line (pencil pressure). Default: 0.4 */
  pressureVariation?: number;
  /** Random seed — change to get a different sketch. Default: 42 */
  seed?: number;
  /** Border radius override for "rect" shape (px). Default: 12 */
  borderRadius?: number;
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function drawHatch(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  shape: PencilShadowShape,
  opts: Required<PencilShadowOptions>
) {
  const dpr = window.devicePixelRatio || 1;
  const totalW = width + opts.offset + 6;
  const totalH = height + opts.offset + 6;

  canvas.width = totalW * dpr;
  canvas.height = totalH * dpr;
  canvas.style.width = `${totalW}px`;
  canvas.style.height = `${totalH}px`;
  canvas.style.left = "0px";
  canvas.style.top = "0px";

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, totalW, totalH);

  const ox = opts.offset;
  const oy = opts.offset;
  const rand = seededRand(opts.seed);
  const angleRad = (opts.angle * Math.PI) / 180;

  // Build clipping path
  const buildPath = () => {
    ctx.beginPath();
    if (shape === "pill") {
      const r = height / 2;
      ctx.moveTo(ox + r, oy);
      ctx.arcTo(ox + width, oy, ox + width, oy + height, r);
      ctx.arcTo(ox + width, oy + height, ox, oy + height, r);
      ctx.arcTo(ox, oy + height, ox, oy, r);
      ctx.arcTo(ox, oy, ox + width, oy, r);
      ctx.closePath();
    } else if (shape === "circle") {
      const r = Math.min(width, height) / 2;
      ctx.arc(ox + width / 2, oy + height / 2, r, 0, Math.PI * 2);
    } else {
      const r = opts.borderRadius;
      ctx.roundRect(ox, oy, width, height, r);
    }
  };

  // Clip to shape
  ctx.save();
  buildPath();
  ctx.clip();

  // Draw hatch lines
  const diag = Math.sqrt(width * width + height * height) * 2;
  const cx = ox + width / 2;
  const cy = oy + height / 2;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  for (let d = -diag; d < diag; d += opts.spacing) {
    const r2 = rand();
    const alpha = opts.opacity * (1 - opts.pressureVariation * r2);
    const lw = opts.lineWidth * (0.6 + 0.8 * rand());
    const wobbleStart = (rand() - 0.5) * opts.wobble * 2;
    const wobbleEnd = (rand() - 0.5) * opts.wobble * 2;

    const perpX = -sin;
    const perpY = cos;
    const len = diag;

    const startX = cx + perpX * d - cos * (len / 2) + sin * wobbleStart;
    const startY = cy + perpY * d - sin * (len / 2) + cos * wobbleStart;
    const endX = cx + perpX * d + cos * (len / 2) + sin * wobbleEnd;
    const endY = cy + perpY * d + sin * (len / 2) + cos * wobbleEnd;
    const midX = (startX + endX) / 2 + (rand() - 0.5) * opts.wobble;
    const midY = (startY + endY) / 2 + (rand() - 0.5) * opts.wobble;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.strokeStyle = `rgba(20,20,20,${alpha})`;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  ctx.restore();

  // Outline border
  buildPath();
  ctx.strokeStyle = "rgba(20,20,20,0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

const DEFAULTS: Required<PencilShadowOptions> = {
  offset: 7,
  spacing: 4,
  wobble: 1.5,
  opacity: 0.55,
  lineWidth: 0.7,
  angle: 45,
  pressureVariation: 0.4,
  seed: 42,
  borderRadius: 12,
};

/**
 * Attaches a pencil-hatch canvas shadow behind a referenced element.
 *
 * Usage:
 *   const ref = usePencilShadow<HTMLButtonElement>("pill", { offset: 8 });
 *   <button ref={ref}>Click me</button>
 */
export function usePencilShadow<T extends HTMLElement>(
  shape: PencilShadowShape = "rect",
  options: PencilShadowOptions = {}
) {
  const elementRef = useRef<T>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const opts = { ...DEFAULTS, ...options };

    // Ensure wrapper is positioned
    const parent = el.parentElement!;
    const parentPos = getComputedStyle(parent).position;
    if (parentPos === "static") parent.style.position = "relative";

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0";
    el.style.position = "relative";
    el.style.zIndex = "1";
    parent.insertBefore(canvas, el);
    canvasRef.current = canvas;

    const render = () => {
      drawHatch(canvas, el.offsetWidth, el.offsetHeight, shape, opts);
    };

    render();

    const ro = new ResizeObserver(render);
    ro.observe(el);

    return () => {
      ro.disconnect();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, JSON.stringify(options)]);

  return elementRef;
}
