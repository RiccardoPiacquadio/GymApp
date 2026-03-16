import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimeSeriesPoint } from "../types/analytics";

type VolumeChartProps = {
  data: TimeSeriesPoint[];
  title?: string;
};

export const VolumeChart = ({ data, title = "Volume nel tempo" }: VolumeChartProps) => (
  <div className="app-panel p-4">
    <p className="mb-3 text-sm font-semibold text-ink">{title}</p>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ef5b2a" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#ef5b2a" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#cfc5b6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#4b5563" }} />
          <YAxis tick={{ fontSize: 12, fill: "#4b5563" }} />
          <Tooltip contentStyle={{ borderRadius: 16, borderColor: "#c8c0b4", backgroundColor: "#fbf8f1" }} />
          <Area type="monotone" dataKey="value" stroke="#ef5b2a" fill="url(#volumeFill)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
