export const motionFiniteNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
};
