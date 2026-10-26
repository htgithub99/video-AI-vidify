import { MOTION_PACK as K } from "../../../constants/motionPack.js";
import { PUPPET_TYPES as T, type PuppetType } from "../../../constants/motionPuppet.js";
import type { PuppetGen } from "../../../types/motionPuppet.js";
import { readPuppet } from "./kitLibrary.js";
import { puppetPackActive, withPuppetPackSnapshot } from "./packPolicy.js";
export const withPuppetGenPack = <R>(gen: PuppetGen, fn: () => R): R => {
  const checked = (): R => {
    if (puppetPackActive()) {
      if (gen.pack && gen.pack.styleId !== gen.styleId) throw new Error(K.SNAPSHOT_INVALID);
      const references: [PuppetType, string[]][] = [
        [T.STYLE, [gen.styleId]],
        [T.CHARACTER, Object.values(gen.characters)],
        [T.SET, Object.values(gen.sets)],
        [T.PROP, Object.values(gen.props)],
      ];
      for (const [type, ids] of references) {
        const missing = ids.filter((id) => !readPuppet(type, id));
        if (missing.length) throw new Error(K.MISSING(type, missing));
      }
    }
    return fn();
  };
  if (gen.pack) return withPuppetPackSnapshot(gen.pack, checked);
  return checked();
};
