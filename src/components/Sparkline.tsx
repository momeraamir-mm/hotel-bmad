"use client";

export function Sparkline({ series, width = 64, height = 22 }: { series: number[]; width?: number; height?: number }) {
  if (!series || series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const stepX = width / (series.length - 1);
  const points = series.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const rising = series[series.length - 1] >= series[0];
  const stroke = rising ? "#c0392b" : "#1e8449";
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r="2" fill={stroke} />
    </svg>
  );
}
