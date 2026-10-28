export type MotionRegion = "vn" | "east_asia" | "south_asia" | "europe" | "russia" | "middle_east" | "americas" | "africa";
export interface MotionTraits {
  region?: MotionRegion;
  from?: number;
  to?: number;
}
