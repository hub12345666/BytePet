interface StatBarProps {
  label: string;
  value: number;
  tone: "cyan" | "pink";
}

export function StatBar({ label, value, tone }: StatBarProps) {
  const color = tone === "cyan" ? "from-cyan-300 to-blue-500" : "from-pink-300 to-rose-500";

  return (
    <div className="rounded-[7px] border border-white/70 bg-white/58 px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-600">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <div className={`stat-bar-fill h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
