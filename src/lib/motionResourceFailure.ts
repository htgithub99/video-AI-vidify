import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_RESOURCE_FAILURE as C } from "../constants/motionResourceFailure.js";
export interface MotionResourceDiagnostic {
  kind: string;
  reason: (typeof C.REASONS)[keyof typeof C.REASONS];
  place?: string;
  name: string;
  needs?: string[];
  details: string[];
  candidates?: { id: string; issues: string[] }[];
}
export class MotionResourceError extends Error {
  readonly code = C.CODE;
  constructor(readonly diagnostic: MotionResourceDiagnostic) {
    super(C.MESSAGE(diagnostic.name, diagnostic.reason, diagnostic.details));
    this.name = C.CODE;
  }
}
export const isMotionResourceError = (error: unknown): error is MotionResourceError => error instanceof MotionResourceError || (!!error && typeof error === "object" && RT_CORE.CODE in error && error.code === C.CODE && RT_CORE.DIAGNOSTIC in error);
