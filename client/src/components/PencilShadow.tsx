import React, { useRef, useEffect, useCallback } from "react";

export type PencilShadowShape = "pill" | "circle" | "rect";

export interface PencilShadowOptions {
  offset?: number;
  spacing?: number;
  wobble?: number;
  opacity?: number;
  lineWidth?: number;
  angle?: number;
  pressureVariation?: number;
  seed?: number;
  borderRadius?: number;
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
  const pad = 2; // small anti-clip padding

  // Canvas is bigger than the element to fit the offset shadow
  const canvasW = width + opts.offset + pad;
  const canvasH = height + opts.offset + pad;

  canvas.width = canvasW * dpr;
  canvas.height = canvasH * dpr;
  canvas.style.width = `${canvasW}px`;
  canvas.style.height = `${canvasH}px`;
  // Position canvas so top-left aligns with element top-left
  // Shadow overflows bottom-right naturally
  canvas.style.top = "0px";
  canvas.style.left = "0px";

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Shadow rect is drawn at (offset, offset), same size as the element
  const ox = opts.offset;
  const oy = opts.offset;
  const sw = width;
  const sh = height;

  const rand = seededRand(opts.seed);
  const angleRad = (opts.angle * Math.PI) / 180;

  const buildPath = () => {
    ctx.beginPath();
    if (shape === "pill") {
      const r = sh / 2;
      ctx.moveTo(ox + r, oy);
      ctx.arcTo(ox + sw, oy, ox + sw, oy + sh, r);
      ctx.arcTo(ox + sw, oy + sh, ox, oy + sh, r);
      ctx.arcTo(ox, oy + sh, ox, oy, r);
      ctx.arcTo(ox, oy, ox + sw, oy, r);
      ctx.closePath();
    } else if (shape === "circle") {
      const r = Math.min(sw, sh) / 2;
      ctx.arc(ox + sw / 2, oy + sh / 2, r, 0, Math.PI * 2);
    } else {
      ctx.roundRect(ox, oy, sw, sh, opts.borderRadius);
    }
  };

  ctx.save();
  buildPath();
  ctx.clip();

  const diag = Math.sqrt(sw * sw + sh * sh) * 2;
  const cx = ox + sw / 2;
  const cy = oy + sh / 2;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  for (let d = -diag; d < diag; d += opts.spacing) {
    const r2 = rand();
    const alpha = opts.opacity * (1 - opts.pressureVariation * r2);
    const lw = opts.lineWidth * (0.6 + 0.8 * rand());
    const wobbleStart = (rand() - 0.5) * opts.wobble * 2;
    const wobbleEnd = (rand() - 0.5) * opts.wobble * 2;
    const len = diag;

    const startX = cx + (-sin) * d - cos * (len / 2) + sin * wobbleStart;
    const startY = cy + cos * d - sin * (len / 2) + cos * wobbleStart;
    const endX = cx + (-sin) * d + cos * (len / 2) + sin * wobbleEnd;
    const endY = cy + cos * d + sin * (len / 2) + cos * wobbleEnd;
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

  buildPath();
  ctx.strokeStyle = "rgba(20,20,20,0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

interface PencilShadowProps extends PencilShadowOptions {
  shape?: PencilShadowShape;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PencilShadow({
  shape = "rect",
  children,
  className,
  style,
  ...options
}: PencilShadowProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const opts: Required<PencilShadowOptions> = { ...DEFAULTS, ...options };

  const render = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const { offsetWidth, offsetHeight } = wrapper;
    if (offsetWidth === 0 || offsetHeight === 0) return;
    drawHatch(canvas, offsetWidth, offsetHeight, shape, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, JSON.stringify(opts)]);

  useEffect(() => {
    const id = requestAnimationFrame(render);
    const ro = new ResizeObserver(() => requestAnimationFrame(render));
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [render]);

  return (
    /*
      overflow: visible — lets the canvas bleed outside the wrapper bounds
      so the shadow (drawn at offset) shows below-right of the button.

      The canvas sits at position:absolute top/left 0 but is physically
      larger than the wrapper, so it overflows naturally.
      It renders BEFORE children in the DOM = behind them in paint order,
      no z-index needed at all.
    */
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "visible",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}