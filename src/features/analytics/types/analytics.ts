export type TimeSeriesPoint = {
  label: string;
  value: number;
  date: string;
};

export type FrequencyPoint = {
  label: string;
  value: number;
};

export type ExerciseHistoryPoint = {
  sessionId: string;
  sessionDate: string;
  volume: number;
  topWeight: number;
  totalSets: number;
  totalReps: number;
};

export type SessionVolumePoint = {
  sessionId: string;
  sessionDate: string;
  totalVolume: number;
};
