import { useRef, useEffect } from "react";
import rough from "roughjs";

interface RoughShadowProps {
  children: React.ReactNode;
  offset?: number;
  roughness?: number;
  hachureGap?: number;
  fillWeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function RoughShadow({
  children,
  offset = 5,
  roughness = 0.5,
  hachureGap = 3,
  fillWeight = 1.2,
  className,
  style,
}: RoughShadowProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const render = () => {
      const wrapper = wrapperRef.current;
      const canvas = canvasRef.current;
      if (!wrapper || !canvas) return;

      // measure the child element directly, not the wrapper
      // so padding on wrapper doesn't inflate the shadow
      const child = wrapper.querySelector<HTMLElement>(":not(canvas)");
      if (!child) return;

      const w = child.offsetWidth;
      const h = child.offsetHeight;
      if (!w || !h) return;

      // offset the canvas so it aligns with the child, not the wrapper
      const childLeft = child.offsetLeft;
      const childTop = child.offsetTop;

      const dpr = window.devicePixelRatio || 1;
      const canvasW = w + offset + 4;
      const canvasH = h + offset + 4;

      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${canvasH}px`;
      canvas.style.left = `${childLeft}px`;
      canvas.style.top = `${childTop}px`;

      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvasW, canvasH);

      const rc = rough.canvas(canvas);
      rc.rectangle(offset, offset, w, h, {
        roughness,
        fillStyle: "hachure",
        fill: "#1a1a1a",
        fillWeight,
        hachureAngle: 45,
        hachureGap,
        stroke: "#1a1a1a",
        strokeWidth: 1.2,
        seed: 42,
      });
    };

    const id = requestAnimationFrame(render);
    const ro = new ResizeObserver(() => requestAnimationFrame(render));
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [offset, roughness, hachureGap, fillWeight]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "visible",
        isolation: "isolate",
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
          zIndex: -1,
        }}
      />
      {children}
    </div>
  );
}