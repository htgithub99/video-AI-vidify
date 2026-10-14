import * as MR from "../constants/motionRuntime.js";
export const planMotionCoverage = (staging: any, duration: number, beatIndex = 0, storyText: string = MR.MOTION_TEXT_EMPTY, beat: any = {}): any[] => {
  const supplied: any[] = staging?.cameras?.length ? staging.cameras : [staging?.camera || {}];
  const explicit = Array.isArray(staging?.cameras) && staging.cameras.length > 0;
  const count = explicit ? Math.min(4, supplied.length) : duration >= 7 ? 3 : duration >= 4.5 ? 2 : 1;
  const actors: any[] = staging?.actors || [];
  const props: any[] = Array.isArray(staging?.props) ? staging.props : [];
  const focus = actors[beatIndex % Math.max(1, actors.length)]?.cast;
  const namedProps = props.filter((p) => p?.name || p?.id);
  const words = MR.MOTION_TEMPLATE_SYMBOL_69(storyText, beat.action || MR.MOTION_TEXT_EMPTY)
    .toLowerCase()
    .split(/[^\p{L}\p{N}_]+/u)
    .filter((w) => w.length > 2);
  const ranked = namedProps
    .map((p) => ({
      p,
      score: words.filter((w) =>
        MR.MOTION_TEMPLATE_SYMBOL_70(p.name || MR.MOTION_TEXT_EMPTY, p.id || MR.MOTION_TEXT_EMPTY)
          .toLowerCase()
          .includes(w),
      ).length,
    }))
    .sort((a, b) => b.score - a.score)[0];
  const detailTarget = ranked?.p;
  const hasDetail = !!detailTarget && (ranked.score > 0 || !actors.length);
  const shots = !actors.length ? [MR.MOTION_TEXT_WIDE, hasDetail ? MR.MOTION_TEXT_INSERT : MR.MOTION_TEXT_WIDE, MR.MOTION_TEXT_WIDE, MR.MOTION_TEXT_WIDE] : hasDetail ? [MR.MOTION_TEXT_WIDE, MR.MOTION_TEXT_MEDIUM, MR.MOTION_TEXT_INSERT, MR.MOTION_TEXT_CLOSE] : [MR.MOTION_TEXT_WIDE, MR.MOTION_TEXT_MEDIUM, MR.MOTION_TEXT_CLOSE, MR.MOTION_TEXT_WIDE];
  const moves = [MR.MOTION_TEXT_DOLLY_IN, beatIndex % 2 ? MR.MOTION_TEXT_ORBIT_RIGHT : MR.MOTION_TEXT_ORBIT_LEFT, MR.MOTION_TEXT_DOLLY_IN, MR.MOTION_TEXT_DOLLY_OUT];
  return Array.from({ length: count }, (_, index) => {
    const source = supplied[index] || supplied[0] || {};
    const authored = explicit && supplied[index];
    const shot = authored?.shot || (count === 1 ? (!actors.length ? MR.MOTION_TEXT_WIDE : hasDetail ? MR.MOTION_TEXT_INSERT : MR.MOTION_TEXT_WIDE) : shots[index]);
    const camera: any = { ...source, at: authored?.at ?? index / count, shot, move: moves[index], amount: shot === MR.MOTION_TEXT_WIDE ? 0.22 : 0.28, angle: index === 0 ? (beatIndex % 2 ? -8 : 8) : index === 1 ? (beatIndex % 2 ? -28 : 28) : beatIndex % 2 ? -42 : 42 };
    if (authored) for (const key of [MR.MOTION_TEXT_MOVE, MR.MOTION_TEXT_AMOUNT, MR.MOTION_TEXT_ANGLE]) if (authored[key] !== undefined) camera[key] = authored[key];
    if (authored?.focus) camera.focus = authored.focus;
    else if (index > 0 && focus && !source.focusProp) camera.focus = source.focus || focus;
    else delete camera.focus;
    if (shot === MR.MOTION_TEXT_INSERT && detailTarget) {
      camera.focusProp = source.focusProp || detailTarget.name || detailTarget.id;
      delete camera.focus;
    }
    delete camera.follow;
    if (index > 0 && !authored) {
      delete camera.pos;
      if (focus || camera.focusProp) delete camera.target;
    }
    return camera;
  });
};
