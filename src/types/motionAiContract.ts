export interface MotionAiContractState {
  rejected: number;
  errors: string[];
  routes?: Record<string, number>;
  progress?: { key: string; unchanged: number };
  recovery?: { revision: string; previous: { revision?: string; rejected: number; errors: string[]; routes?: Record<string, number> }[] };
}
