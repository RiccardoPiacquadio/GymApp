import { useLiveQuery } from "dexie-react-hooks";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getOneRepMaxHistory } from "../services/oneRepMaxService";
import { formatDate } from "../../../lib/dates";

type OneRepMaxChartProps = {
  userId: string;
  canonicalExerciseId: string;
};

export const OneRepMaxChart = ({ userId, canonicalExerciseId }: OneRepMaxChartProps) => {
  const data = useLiveQuery(
    () => getOneRepMaxHistory(userId, canonicalExerciseId),
    [userId, canonicalExerciseId],
    []
  );

  if (data.length < 2) return null;

  const chartData = data.map((d) => ({
    label: formatDate(d.date),
    e1rm: d.estimated1RM,
    detail: `${d.weight}kg × ${d.reps}`
  }));

  return (
    <section className="app-panel space-y-3 p-5">
      <h3 className="text-sm font-semibold">1RM stimato nel tempo</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)" }}
            formatter={(value: number) => [`${value} kg`, "1RM stimato"]}
          />
          <Line
            type="monotone"
            dataKey="e1rm"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 3, fill: "#f97316" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
};
