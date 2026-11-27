const W = (list) => new RegExp(`^(?:${list})$`, "i");
const GUN = "guns?|gunfire|gunshots?|shots?|shoots?|shooting|shot|fires?|fired|firing|bullets?|rifles?|revolvers?|pistols?|bang";
const BLAST = "shells?|shelling|bombs?|bombing|bombed|explodes?|exploded|explosions?|blasts?|grenades?|artillery|crash|crashes|crashed|mines?|cannons?";
const BLADE = "swords?|blades?|katana|slash|slashes|strikes?|struck|cuts?|duels?|clash|clashes|spears?|stabs?|stabbed|charge|charges";
const BATTLE = "battles?|fights?|fighting|attacks?|attacked|siege|legions?|arena|war|kills?|killed";
export const LOOKS = {
  base: { grade: "", fx: "", cam: { push: 1, pan: 1 }, impact: { re: W(`${BLAST}|${GUN}|${BLADE}`), kind: "hit" }, accent: null, amb: "" },
  ww: { grade: "war", fx: "ash", cam: { push: 1.1, pan: 1 }, impact: { re: W(`${BLAST}|${GUN}|machine|tanks?|attack|attacked`), kind: "hit" }, accent: null, amb: "news" },
  wildwest: { grade: "old", fx: "dust", cam: { push: 1, pan: 1.1 }, impact: { re: W(`${GUN}|robs?|robbed|robbery|ambush`), kind: "hit" }, accent: { re: W("wanted|reward|duel|draw|draws|sheriff|outlaw|outlaws|marshal|hanged|noose|bounty"), kind: "zoom", amt: 0.07, dur: 0.35 }, amb: "sun" },
  ancient: { grade: "warm", fx: "motes", cam: { push: 0.8, pan: 0.85 }, impact: { re: W(`${BLADE}|${BATTLE}|crucified|whips?`), kind: "hit" }, accent: { re: W("rome|emperor|senate|gods?|consul|dictator|triumph|crown|empire"), kind: "zoom", amt: 0.05, dur: 0.8 }, amb: "rays" },
  victorian: { grade: "gaslight", fx: "fog", cam: { push: 0.75, pan: 0.8 }, impact: { re: W(`${GUN}|screams?|murder|murdered|falls|fell|falling|waterfall`), kind: "hit" }, accent: { re: W("clues?|footprints?|ash|letter|note|poison|poisoned|evidence|deduce|deduction|tracks|mud|cipher"), kind: "spot", amt: 0.05, dur: 0.5 }, amb: "gas" },
  eastasia: { grade: "silk", fx: "petals", cam: { push: 1, pan: 1 }, impact: { re: W(`${BLADE}|${BATTLE}|${GUN}`), kind: "slash" }, accent: null, amb: "" },
  medieval: { grade: "stone", fx: "embers", cam: { push: 0.9, pan: 0.9 }, impact: { re: W(`${BLADE}|${BATTLE}|arrows?|burns?|burned|plague`), kind: "hit" }, accent: null, amb: "" },
};
export const ARTS = {
  anime: { grade: "anime", cam: { push: 1.15, pan: 1 }, speed: true, accent: { re: W("never|dead|gone|nothing|suddenly|alone|everything|nobody|impossible|genius"), kind: "punch", amt: 0.09, dur: 0.18 } },
};
export const LIMITS = { impactGap: 2.5, accentGap: 6, edgeIn: 0.12, edgeOut: 0.3 };
export const lookOf = (plan) => {
  const base = LOOKS[plan.look] || LOOKS.base, art = ARTS[plan.art];
  return { ...base, grade: base.grade || art?.grade || "", art: art || null, cam: { push: base.cam.push * (art?.cam.push || 1), pan: base.cam.pan * (art?.cam.pan || 1) } };
};
const clean = (w) => String(w).toLowerCase().replace(/[^a-z']/g, "").replace(/'s$/, "");
export const lookEvents = (plan, shots) => {
  const look = lookOf(plan);
  const words = (plan.words || []).flat().map(([s, , w]) => ({ s, w: clean(w) }));
  let lastImp = -99, lastAcc = -99;
  for (const sh of shots) {
    if (sh.kind !== "scene") continue;
    const inShot = words.filter((x) => x.s >= sh.t0 + LIMITS.edgeIn && x.s <= sh.t1 - LIMITS.edgeOut);
    const imp = look.impact && inShot.find((x) => look.impact.re.test(x.w));
    if (imp && imp.s - lastImp >= LIMITS.impactGap) {
      sh.impact = { t: imp.s, kind: look.impact.kind, speed: !!look.art?.speed };
      lastImp = imp.s;
      continue;
    }
    const accents = [look.accent, look.art?.accent].filter(Boolean);
    for (const a of accents) {
      const hit = inShot.find((x) => a.re.test(x.w));
      if (hit && hit.s - lastAcc >= LIMITS.accentGap) {
        sh.accent = { t: hit.s, kind: a.kind, amt: a.amt, dur: a.dur };
        lastAcc = hit.s;
        break;
      }
    }
  }
  return look;
};
export const punchCam = (cam, t0, t1, a) => {
  const rel = a.t - t0, end = t1 - t0, k = 1 + a.amt;
  if (rel <= 0 || rel + a.dur >= end) return cam;
  const at = (t) => {
    let i = 0;
    while (i + 1 < cam.length && cam[i + 1].t <= t) i++;
    const A = cam[i], B = cam[Math.min(i + 1, cam.length - 1)], u = B.t > A.t ? Math.min(1, Math.max(0, (t - A.t) / (B.t - A.t))) : 0;
    const m = (p) => A[p] + (B[p] - A[p]) * u;
    return { ...A, t, s: m("s"), tx: m("tx"), ty: m("ty"), sx: m("sx"), sy: m("sy"), ease: undefined };
  };
  const before = cam.filter((c) => c.t < rel), after = cam.filter((c) => c.t > rel + a.dur);
  const hit = at(rel), peak = at(rel + a.dur);
  return [...before, hit, { ...peak, s: peak.s * k }, ...after.map((c) => ({ ...c, s: c.s * k }))];
};
export const AMB = {
  news: { cls: "amb-news", keys: 14, step: 0.11, from: 0.02, to: 0.09 },
  sun: { cls: "amb-sun", keys: 8, step: 0.6, from: 0.35, to: 0.6 },
  rays: { cls: "amb-rays", keys: 6, step: 1.6, from: 0.25, to: 0.55 },
  gas: { cls: "amb-gas", keys: 12, step: 0.14, from: 0.55, to: 0.85 },
};
