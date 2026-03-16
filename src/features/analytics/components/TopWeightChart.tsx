import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimeSeriesPoint } from "../types/analytics";

type TopWeightChartProps = {
  data: TimeSeriesPoint[];
};

export const TopWeightChart = ({ data }: TopWeightChartProps) => (
  <div className="app-panel p-4">
    <p className="mb-3 text-sm font-semibold text-ink">Top weight nel tempo</p>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#cfc5b6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#4b5563" }} />
          <YAxis tick={{ fontSize: 12, fill: "#4b5563" }} />
          <Tooltip contentStyle={{ borderRadius: 16, borderColor: "#c8c0b4", backgroundColor: "#fbf8f1" }} />
          <Line type="monotone" dataKey="value" stroke="#2b3440" strokeWidth={3} dot={{ r: 4, fill: "#ef5b2a" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);
