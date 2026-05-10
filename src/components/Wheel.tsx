import { useEffect, useRef, useState } from "react";

interface WheelProps {
  options: string[];
  onResult: (option: string, index: number) => void;
}

const PALETTE = [
  "var(--color-wheel-1)",
  "var(--color-wheel-2)",
  "var(--color-wheel-3)",
  "var(--color-wheel-4)",
  "var(--color-wheel-5)",
  "var(--color-wheel-6)",
  "var(--color-wheel-7)",
  "var(--color-wheel-8)",
];

export function Wheel({ options, onResult }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const wheelRef = useRef<SVGSVGElement>(null);

  const n = options.length;
  const slice = 360 / Math.max(n, 1);
  const radius = 200;
  const cx = 220;
  const cy = 220;

  // Resolve oklch palette to actual color strings (so SVG fills render correctly)
  const [resolved, setResolved] = useState<string[]>([]);
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    setResolved(PALETTE.map((v) => root.getPropertyValue(v.slice(4, -1)).trim() || "#cce"));
  }, []);

  const spin = () => {
    if (spinning || n < 2) return;
    setSpinning(true);
    // Uniform random stop angle on the brim — any point equally likely.
    const stopAngle = Math.random() * 360;
    const fullTurns = 6 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + fullTurns * 360 + (360 - (((rotation % 360) + stopAngle) % 360));
    // Determine which slice the pointer (top, 0°) lands in given stopAngle.
    // After rotation, slice i (originally [i*slice, (i+1)*slice]) sits under the pointer
    // when stopAngle falls in that range.
    const winner = Math.floor(stopAngle / slice) % n;
    setRotation(finalRotation);
    setTimeout(() => {
      setSpinning(false);
      onResult(options[winner], winner);
    }, 4600);
  };

  const polar = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10">
          <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent border-t-primary drop-shadow-md" />
          <div className="w-3 h-3 rounded-full bg-primary mx-auto -mt-1 shadow" />
        </div>

        {/* Outer dotted ring */}
        <div className="absolute inset-0 rounded-full border-[6px] border-dashed border-primary/30 animate-float-soft pointer-events-none" />

        <svg
          ref={wheelRef}
          width={440}
          height={440}
          viewBox="0 0 440 440"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.17, 1)" : "none",
            filter: "drop-shadow(0 8px 24px rgba(120, 180, 200, 0.25))",
          }}
        >
          <circle cx={cx} cy={cy} r={radius + 8} fill="var(--color-card)" />
          {n === 0 ? (
            <circle cx={cx} cy={cy} r={radius} fill="var(--color-muted)" />
          ) : n === 1 ? (
            <>
              <circle cx={cx} cy={cy} r={radius} fill={resolved[0] || "#cce"} />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="20"
                fontWeight="600"
                fill="var(--color-foreground)"
              >
                {truncate(options[0])}
              </text>
            </>
          ) : (
            options.map((opt, i) => {
              const startAngle = i * slice;
              const endAngle = (i + 1) * slice;
              const [x1, y1] = polar(startAngle, radius);
              const [x2, y2] = polar(endAngle, radius);
              const largeArc = slice > 180 ? 1 : 0;
              const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
              const midAngle = startAngle + slice / 2;
              // Text radial: place along radius from inner to outer, perpendicular to circle = aligned with radius
              // We position text at distance r from center, rotated so it reads outward from center.
              const textR = radius * 0.62;
              const [tx, ty] = polar(midAngle, textR);
              const fill = resolved[i % resolved.length] || "#cce";
              return (
                <g key={i}>
                  <path d={path} fill={fill} stroke="var(--color-card)" strokeWidth="2" />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(11, Math.min(18, 180 / Math.max(opt.length, 4)))}
                    fontWeight="600"
                    fill="oklch(0.3 0.05 200)"
                    transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                  >
                    {truncate(opt)}
                  </text>
                </g>
              );
            })
          )}
          {/* Center hub */}
          <circle cx={cx} cy={cy} r={28} fill="var(--color-card)" stroke="var(--color-primary)" strokeWidth="3" />
          <circle cx={cx} cy={cy} r={10} fill="var(--color-primary)" />
        </svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning || n < 2}
        className="mt-8 px-10 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {spinning ? "转动中…" : n < 2 ? "至少添加 2 个选项" : "开始抽取 ✨"}
      </button>
    </div>
  );
}

function truncate(s: string) {
  return s.length > 10 ? s.slice(0, 9) + "…" : s;
}
