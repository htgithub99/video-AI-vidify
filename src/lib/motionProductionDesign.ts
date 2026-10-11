import * as MR from "../constants/motionRuntime.js";
export const MOTION_PRODUCTION_BRIEF = MR.MOTION_TEXT_FIRST_PASS_PRODUCTION_CONTRACT_DESIGN_THE_SET_CAST_AND_CAMERAS_TO;
export const productionBriefFor = ( place: { name?: string; description?: string; interior?: boolean; }, context = "", ): string => { return MR.MOTION_TEMPLATE_DESIGN_THIS_SCENE_FROM_THE_PROJECT_CREATIVE_BLUEPRINT_ITS_INPUT_E(MOTION_PRODUCTION_BRIEF, JSON.stringify({ name: place.name, description: place.description, interior: place.interior, usage: context })); };
const finiteVector = (value: any, length: number): boolean => Array.isArray(value) && value.length >= length && value.slice(0, length).every((n: any) => typeof n === MR.MOTION_TEXT_NUMBER && Number.isFinite(n));
export const buriedSurfaceErrors = (location: any): string[] => {
  const errors: string[] = [];
  const extent = (node: any): number[] | null => {
    const d = node.shape === MR.MOTION_TEXT_BOX ? node.size : node.shape === MR.MOTION_TEXT_CYLINDER ? [node.radius * 2, node.height, node.radius * 2] : null;
    if (!d || !finiteVector(node.pos, 3)) return null;
    const [x, y, z] = (node.rot || [0, 0, 0]).map((n: number) => (n * Math.PI) / 180);
    const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
    const m = [cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx, cx * sz, cx * cz, -sx, -sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx];
    return [0, 1, 2].map((i) => Math.abs(m[i * 3]) * d[0] + Math.abs(m[i * 3 + 1]) * d[1] + Math.abs(m[i * 3 + 2]) * d[2]);
  };
  const walk = (nodes: any[]) => {
    for (const detail of nodes || []) {
      const d = extent(detail);
      if (d && Math.min(...d) < Math.max(...d) * 0.12 && Math.max(...d) > 0.03) {
        for (const casing of nodes || []) {
          if (casing === detail || casing.open || casing.hidden) continue;
          const material = typeof casing.mat === MR.MOTION_TEXT_STRING ? location.materials?.[casing.mat] : casing.mat;
          if (material?.glass || (material?.opacity ?? 1) < 0.95) continue;
          const c = extent(casing);
          if (!c || Math.min(...c) < Math.max(...c) * 0.15) continue;
          if (d.every((size: number, i: number) => Math.abs(detail.pos[i] - casing.pos[i]) + size / 2 < c[i] / 2 - 0.0005)) { errors.push(MR.MOTION_TEMPLATE_DETAIL_AT_IS_FULLY_INSIDE_OPAQUE_CENTRE_EXTENT_MOVE_ITS_VISIBLE_S(detail.name || detail.shape, JSON.stringify(detail.pos), casing.name || casing.shape, JSON.stringify(casing.pos), JSON.stringify(c))); break; }
        }
      }
      walk(detail.children);
      if (detail.node) walk([detail.node]);
    }
  };
  walk(location.nodes);
  for (const nodes of Object.values(location.defs || {})) walk(nodes as any[]);
  return errors;
};
export const productionLocationErrors = (location: any): string[] => {
  const errors: string[] = [];
  if (!finiteVector(location?.stage?.center, 2) || !finiteVector(location?.stage?.size, 2) || location.stage.size.some((n: number) => n <= 0)) errors.push(MR.MOTION_TEXT_STAGE_MUST_HAVE_A_FINITE_CENTRE_AND_POSITIVE_USABLE_DIMENSIONS);
  if (!finiteVector(location?.camera?.pos, 3) || !finiteVector(location?.camera?.target, 3)) errors.push(MR.MOTION_TEXT_CAMERA_REQUIRES_FINITE_POSITION_AND_TARGET); else if (Math.hypot(...location.camera.pos.map((n: number, i: number) => n - location.camera.target[i])) < 0.1) errors.push(MR.MOTION_TEXT_CAMERA_POSITION_AND_TARGET_COINCIDE);
  for (const [name, point] of Object.entries(location?.marks || {})) if (!finiteVector(point, 2)) errors.push(MR.MOTION_TEMPLATE_STATION_REQUIRES_FINITE_X_Z_COORDINATES(name));
  const refs = new Set<string>();
  let lights = 0;
  const walk = (nodes: any[]) => { for (const node of nodes || []) { if (node.shape === MR.MOTION_TEXT_USE) refs.add(node.ref); if (node.shape === MR.MOTION_TEXT_LIGHT) lights++; walk(node.children); if (node.node) walk([node.node]); } };
  walk(location?.nodes);
  const visited = new Set<string>();
  for (const name of refs)
    if (!visited.has(name)) { visited.add(name); walk(location?.defs?.[name]); }
  for (const name of Object.keys(location?.defs || {})) if (!refs.has(name)) errors.push(MR.MOTION_TEMPLATE_DEFINITION_IS_NEVER_PLACED_INSTANTIATE_STORY_OBJECTS_IN_NODES_WIT(name));
  if (location?.interior && lights === 0) errors.push(MR.MOTION_TEXT_INTERIOR_HAS_NO_MOTIVATED_LIGHTS_PUT_LIGHT_NODES_INSIDE_NODES_A_W);
  errors.push(...buriedSurfaceErrors(location));
  return errors;
};
export const productionStagingErrors = (staging: any, location: any): string[] => {
  if (!location) return [MR.MOTION_TEXT_STAGING_REFERENCES_A_MISSING_LOCATION];
  const errors: string[] = [], positions: { cast: string; point: number[]; y: number; }[] = [];
  for (const actor of staging.actors || []) {
    const requested = typeof actor.at === MR.MOTION_TEXT_STRING ? location.marks?.[actor.at] : (actor.at ?? actor.pos);
    const point = Array.isArray(requested) && requested.length >= 3 ? [requested[0], requested[2]] : requested;
    if (!finiteVector(point, 2)) { errors.push(MR.MOTION_TEMPLATE_ACTOR_NEEDS_AN_EXISTING_STATION_OR_FINITE_X_Z_COORDINATES(actor.cast)); continue; }
    const y = actor.y ?? 0;
    if (positions.some((other) => other.cast === actor.cast)) errors.push(MR.MOTION_TEMPLATE_ACTOR_APPEARS_TWICE_IN_THE_SAME_SCENE(actor.cast));
    const knownStation = Object.values(location.marks || {}).some((mark: any) => finiteVector(mark, 2) && Math.hypot(mark[0] - point[0], mark[1] - point[1]) < 0.05);
    if (!knownStation && finiteVector(location.stage?.center, 2) && finiteVector(location.stage?.size, 2) && (Math.abs(point[0] - location.stage.center[0]) > location.stage.size[0] / 2 || Math.abs(point[1] - location.stage.center[1]) > location.stage.size[1] / 2)) errors.push(MR.MOTION_TEMPLATE_ACTOR_IS_OUTSIDE_THE_USABLE_STAGE_USE_A_SUPPORTED_STATION(actor.cast));
    for (const other of positions) if (Math.hypot(point[0] - other.point[0], point[1] - other.point[1], y - other.y) < 0.55) errors.push(MR.MOTION_TEMPLATE_ACTORS_AND_OVERLAP_CHOOSE_SEPARATE_SUPPORTED_STATIONS(actor.cast, other.cast));
    positions.push({ cast: actor.cast, point, y });
    if (/^(sit|sit_talk|sit_down|drive)$/.test(actor.action || "") && typeof actor.at === MR.MOTION_TEXT_STRING && /^(aisle_|stand_|door_)/.test(actor.at)) errors.push(MR.MOTION_TEMPLATE_SEATED_ACTOR_IS_ON_A_STANDING_STATION_USE_AN_ACTUAL_SEAT(actor.cast));
  }
  for (const camera of staging.cameras || (staging.camera ? [staging.camera] : [])) {
    if (camera.pos && !finiteVector(camera.pos, 3)) errors.push(MR.MOTION_TEXT_SHOT_CAMERA_POSITION_MUST_BE_FINITE);
    if (camera.target && !finiteVector(camera.target, 3)) errors.push(MR.MOTION_TEXT_SHOT_CAMERA_TARGET_MUST_BE_FINITE);
    if (finiteVector(camera.pos, 3) && finiteVector(camera.target, 3) && Math.hypot(...camera.pos.map((n: number, i: number) => n - camera.target[i])) < 0.1) errors.push(MR.MOTION_TEXT_SHOT_CAMERA_POSITION_AND_TARGET_COINCIDE);
  }
  for (const prop of staging.props || []) {
    if (!finiteVector(prop.pos || prop.position, 3)) errors.push(MR.MOTION_TEMPLATE_PROP_NEEDS_AN_EXPLICIT_WORLD_POSITION_X_Y_Z(prop.name || prop.shape));
    if (!prop.mat && ![MR.MOTION_TEXT_GROUP, MR.MOTION_TEXT_USE, MR.MOTION_TEXT_MODEL, MR.MOTION_TEXT_LIGHT, MR.MOTION_TEXT_REPEAT].includes(prop.shape)) errors.push(MR.MOTION_TEMPLATE_PROP_HAS_NO_MATERIAL_SUPPLY_COMPLETE_RENDERABLE_GEOMETRY_NOT_AN_O(prop.name || prop.shape));
    if ((location.nodes || []).some((node: any) => node.name && node.name === prop.name)) errors.push(MR.MOTION_TEMPLATE_PROP_DUPLICATES_AN_EXISTING_SET_OBJECT_REUSE_ITS_NAME_FOR_FOCUSPR(prop.name));
  }
  if (staging.props?.length > 1 && staging.props.every((p: any) => finiteVector(p.pos, 3) && p.pos.every((n: number) => n === 0))) errors.push(MR.MOTION_TEXT_ALL_ADDED_PROPS_OVERLAP_AT_WORLD_ORIGIN_SPECIFY_SUPPORTED_WORLD_P);
  return errors;
};
export const productionStaging = (staging: any, location: any): any => {
  staging = {
    ...staging,
    actors: (staging.actors || []).map((actor: any) => {
      const copy = { ...actor };
      for (const key of [MR.MOTION_TEXT_MOVETO, MR.MOTION_TEXT_TO, MR.MOTION_TEXT_MOVESTART, MR.MOTION_TEXT_MOVEEND, MR.MOTION_TEXT_THEN, MR.MOTION_TEXT_THENAT]) delete copy[key];
      return copy;
    }),
  };
  if (!location?.marks?.seat_0_left_0 || !location.nodes?.some((node: any) => node.name === MR.MOTION_TEXT_CABIN_FLOOR)) return staging;
  const occupied = new Set<string>();
  return {
    ...staging,
    actors: (staging.actors || []).map((actor: any) => {
      const seated = /^(sit|sit_talk|sit_down|drive)$/.test(actor.action || "");
      const stations = Object.entries(location.marks || {}).filter(([key]) => (seated ? key.startsWith(MR.MOTION_TEXT_SEAT) : /^(aisle_|door_front)/.test(key)));
      const requested = typeof actor.at === MR.MOTION_TEXT_STRING ? location.marks[actor.at] : actor.at;
      const at = Array.isArray(requested) ? requested : location.stage.center;
      const ranked = stations .filter(([key]) => !occupied.has(key)) .sort((a, b) => { const distance = (point: any) => Math.hypot(point[0] - at[0], point[1] - at[1]); return distance(a[1]) - distance(b[1]); });
      const station = ranked[0];
      if (!station) throw new Error(MR.MOTION_TEXT_NO_FREE_PRODUCTION_STATION_FOR_ACTOR);
      occupied.add(station[0]);
      return { ...actor, at: station[0], y: 0, ...(seated ? { action: MR.MOTION_TEXT_SIT, face: 180 } : {}) };
    }),
  };
};
export const isProductionCabin = (place: { name?: string; key?: string }): boolean => { const name = MR.MOTION_TEMPLATE_SYMBOL_73(place.key || "", place.name || ""); return /(aircraft_cabin|airplane_cabin|passenger.cabin|aircraft cabin|airplane cabin|khoang hành khách|cabin máy bay)/i.test(name); };
