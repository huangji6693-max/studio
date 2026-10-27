import React from 'react';
import { Cpu, HardDrive, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const MAX_NETWORK_CPU_INSNS = 100_000_000; // 100M instructions
export const WARN_CPU_INSNS_THRESHOLD = 5_000_000; // 5M instructions warning threshold
export const MAX_NETWORK_MEM_BYTES = 40 * 1024 * 1024; // 40 MB network limit
export const WARN_MEM_BYTES_THRESHOLD = 2 * 1024 * 1024; // 2 MB warning threshold

export interface ResourceFootprintProps {
  cpuInsns: number | string;
  memBytes: number | string;
  minResourceFee?: string;
}

export interface ResourceFootprintMetrics {
  cpuValue: number;
  memValue: number;
  cpuPercent: number;
  memPercent: number;
  isCpuHigh: boolean;
  isMemHigh: boolean;
  formattedMem: string;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

export function computeResourceFootprintMetrics(
  cpuInsns: number | string,
  memBytes: number | string
): ResourceFootprintMetrics {
  const cpuValue = Math.max(0, Number(cpuInsns) || 0);
  const memValue = Math.max(0, Number(memBytes) || 0);

  const cpuPercent = Math.min(100, Number(((cpuValue / MAX_NETWORK_CPU_INSNS) * 100).toFixed(2)));
  const memPercent = Math.min(100, Number(((memValue / MAX_NETWORK_MEM_BYTES) * 100).toFixed(2)));

  // Trigger warning if CPU > 5,000,000 or memory > 2MB (2,000,000 bytes / 2 MiB)
  const isCpuHigh = cpuValue > WARN_CPU_INSNS_THRESHOLD;
  const isMemHigh = memValue > 2_000_000;

  return {
    cpuValue,
    memValue,
    cpuPercent,
    memPercent,
    isCpuHigh,
    isMemHigh,
    formattedMem: formatBytes(memValue),
  };
}

export const ResourceFootprint: React.FC<ResourceFootprintProps> = ({
  cpuInsns,
  memBytes,
  minResourceFee,
}) => {
  const metrics = computeResourceFootprintMetrics(cpuInsns, memBytes);
  const hasWarning = metrics.isCpuHigh || metrics.isMemHigh;

  const cpuBarColor =
    metrics.cpuPercent >= 80
      ? 'bg-red-500'
      : metrics.isCpuHigh
        ? 'bg-yellow-400'
        : 'bg-emerald-400';

  const memBarColor =
    metrics.memPercent >= 80
      ? 'bg-red-500'
      : metrics.isMemHigh
        ? 'bg-yellow-400'
        : 'bg-blue-500';

  return (
    <div
      data-testid="resource-footprint-card"
      className="bg-white border-2 border-black rounded-lg p-3 shadow-[3px_3px_0px_0px_#000000] space-y-3 font-mono text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
        <div className="font-extrabold text-black uppercase tracking-tight flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>Soroban Resource Footprint</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {minResourceFee && (
            <span className="px-2 py-0.5 bg-slate-100 border border-black rounded text-[10px] font-black text-black">
              Min Fee: {minResourceFee} stroops
            </span>
          )}
          {hasWarning ? (
            <span
              data-testid="resource-warning-badge"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-300 border-2 border-black rounded text-[10px] font-black text-black shadow-[1px_1px_0px_0px_#000000]"
            >
              <AlertTriangle className="w-3 h-3 text-black" />
              <span>HIGH RESOURCE USAGE</span>
            </span>
          ) : (
            <span
              data-testid="resource-optimal-badge"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 border border-black rounded text-[10px] font-black text-black"
            >
              <CheckCircle2 className="w-3 h-3 text-black" />
              <span>OPTIMAL</span>
            </span>
          )}
        </div>
      </div>

      {/* CPU Instructions Meter */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-black flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-black" />
            <span>CPU Instructions</span>
            {metrics.isCpuHigh && (
              <span
                data-testid="cpu-warning-badge"
                className="ml-1 px-1.5 py-0.2 bg-yellow-300 border border-black rounded text-[9px] font-black text-black"
              >
                WARN &gt; 5M
              </span>
            )}
          </span>
          <span className="font-extrabold text-black">
            {metrics.cpuValue.toLocaleString()} / {MAX_NETWORK_CPU_INSNS.toLocaleString()} ({metrics.cpuPercent}%)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 border-2 border-black rounded overflow-hidden">
          <div
            data-testid="cpu-progress-bar"
            className={`h-full ${cpuBarColor} transition-all duration-300`}
            style={{ width: `${Math.max(metrics.cpuValue > 0 ? 2 : 0, metrics.cpuPercent)}%` }}
          />
        </div>
      </div>

      {/* Memory Bytes Meter */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-black flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-black" />
            <span>Memory Usage</span>
            {metrics.isMemHigh && (
              <span
                data-testid="mem-warning-badge"
                className="ml-1 px-1.5 py-0.2 bg-yellow-300 border border-black rounded text-[9px] font-black text-black"
              >
                WARN &gt; 2MB
              </span>
            )}
          </span>
          <span className="font-extrabold text-black">
            {metrics.formattedMem} ({metrics.memValue.toLocaleString()} B) / 40.00 MB ({metrics.memPercent}%)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 border-2 border-black rounded overflow-hidden">
          <div
            data-testid="mem-progress-bar"
            className={`h-full ${memBarColor} transition-all duration-300`}
            style={{ width: `${Math.max(metrics.memValue > 0 ? 2 : 0, metrics.memPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ResourceFootprint;
