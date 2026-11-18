import type { MotionSeoPack } from "../../../types/motionVideo.js";
import type { ReupJob, ReupOutputResult } from "../types/reup.js";
/** YouTube chapter marks of an output (photo reports have chapter cards), in Video Motion's SEO shape. */
export const reupSeoChapters = (output?: ReupOutputResult): MotionSeoPack["chapters"] => (output?.chapters || []).map((c, i) => ({ id: `c${i + 1}`, t: c.t, title: c.title }));
/** The run's package as Video Motion's SEO pack, so the same SEO card shows it; chapter times come from the edited video. */
export const reupSeoPack = (job: ReupJob): MotionSeoPack | null => (job.package?.options?.length ? { options: job.package.options, chapters: reupSeoChapters(job.outputs[0]), timingFrom: "voice", scriptKey: job.id } : null);
