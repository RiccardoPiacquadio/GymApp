type SessionSummaryCardProps = {
  totalExercises: number;
  totalSets: number;
  totalVolume: number;
};

export const SessionSummaryCard = ({
  totalExercises,
  totalSets,
  totalVolume
}: SessionSummaryCardProps) => (
  <div className="app-panel grid grid-cols-3 gap-3 p-4">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Esercizi</p>
      <p className="mt-1 text-2xl font-semibold">{totalExercises}</p>
    </div>
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Serie</p>
      <p className="mt-1 text-2xl font-semibold">{totalSets}</p>
    </div>
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Volume</p>
      <p className="mt-1 text-2xl font-semibold">{totalVolume}</p>
    </div>
  </div>
);
