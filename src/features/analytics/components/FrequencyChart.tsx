import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FrequencyPoint } from "../types/analytics";

type FrequencyChartProps = {
  data: FrequencyPoint[];
};

export const FrequencyChart = ({ data }: FrequencyChartProps) => (
  <div className="app-panel p-4">
    <p className="mb-3 text-sm font-semibold text-ink">Frequenza utilizzo</p>
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#cfc5b6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#4b5563" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#4b5563" }} />
          <Tooltip contentStyle={{ borderRadius: 16, borderColor: "#c8c0b4", backgroundColor: "#fbf8f1" }} />
          <Bar dataKey="value" fill="#ef5b2a" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
