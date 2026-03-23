export const getSetVolume = (weight: number, reps: number) => weight * reps;

export const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

/** Format volume as kg or tons for display */
export const formatVolume = (vol: number) =>
  vol >= 1000 ? `${(vol / 1000).toFixed(1)} t` : `${vol} kg`;
