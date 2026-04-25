"use client";

interface SystemInfoProps {
  data: {
    os: string;
    arch: string;
    cpu: { model: string; physical_cores: number; logical_cores: number };
    ram: { total_gb: number; available_gb: number };
    disk: { total_gb: number; free_gb: number };
    gpu: { name: string | null; vram_gb: number | null; type: string | null };
    installed_runtimes: string[];
  } | null;
  loading: boolean;
}

export default function SystemInfo({ data, loading }: SystemInfoProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-3 bg-gray-800 rounded w-full mb-2" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const rows = [
    { label: "OS", value: `${data.os} (${data.arch})` },
    { label: "CPU", value: `${data.cpu.model} · ${data.cpu.physical_cores} cores` },
    { label: "RAM", value: `${data.ram.total_gb} GB total · ${data.ram.available_gb} GB free` },
    { label: "Disk", value: `${data.disk.free_gb} GB free of ${data.disk.total_gb} GB` },
    {
      label: "GPU",
      value: data.gpu.name
        ? `${data.gpu.name}${data.gpu.vram_gb ? ` · ${data.gpu.vram_gb} GB VRAM` : ""}`
        : "None detected",
    },
    {
      label: "Installed",
      value: data.installed_runtimes.length
        ? data.installed_runtimes.join(", ")
        : "No runtimes detected",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-4">
        Your Machine
      </h2>
      <dl className="space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <dt className="text-gray-500 shrink-0">{label}</dt>
            <dd className="text-gray-200 text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
