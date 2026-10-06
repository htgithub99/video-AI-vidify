import JSZip from "jszip";
import _ from "lodash";
import { API_ROUTES } from "../../constants/apiRoutes.js";
import {
  MOTION_TEMPLATE_SYMBOL_12,
  MOTION_TEXT_0F141C,
  MOTION_TEXT_1B222C,
  MOTION_TEXT_222A36,
  MOTION_TEXT_2C3646,
  MOTION_TEXT_2D,
  MOTION_TEXT_3A3430,
  MOTION_TEXT_ANIMATION,
  MOTION_TEXT_BLOB,
  MOTION_TEXT_CANVAS,
  MOTION_TEXT_CHARACTER,
  MOTION_TEXT_CHON_FILE_GLB_GLTF_FBX_HOAC_ZIP_CHUA,
  MOTION_TEXT_E8EEF8,
  MOTION_TEXT_ENGINE_3D_CHUA_SAN_SANG,
  MOTION_TEXT_FFF4E0,
  MOTION_TEXT_IMAGE_JPEG,
  MOTION_TEXT_MODEL,
  MOTION_TEXT_SYMBOL_16,
  MOTION_TEXT_SYMBOL_25,
} from "../../constants/motionRuntime.js";
import type { MotionRealAsset, MotionRealKind, MotionRealManifest } from "../../types/motionVideo.js";
import { motionRequest, type MotionEngineGlobal } from "./motionApi";
const THREE = (): any => (window as any).THREE;
const ADD = (): any => THREE()?.addons || {};
export const loadRealManifest = async (ME?: MotionEngineGlobal | null): Promise<{ manifest: MotionRealManifest; stats: { count: number; bytes: number; byKind: Record<string, number> }; defaults: { hdris: string[]; textures: string[]; models: string[] } }> => {
  const r = await motionRequest<any>(API_ROUTES.MOTION_REAL_MANIFEST);
  const REAL = (ME as any)?.REAL;
  if (REAL?.setManifest) REAL.setManifest(r.manifest, API_ROUTES.MOTION_REAL_FILE);
  return r;
};
export const realFileUrl = (rel?: string): string => (rel ? (/^https?:/.test(rel) ? rel : API_ROUTES.MOTION_REAL_FILE + _.map(rel.split(MOTION_TEXT_SYMBOL_16), encodeURIComponent).join(MOTION_TEXT_SYMBOL_16)) : "");
export interface LoadedModel {
  scene: any;
  animations: any[];
  name: string;
  glb: ArrayBuffer | null;
  stats: { meshes: number; triangles: number; bones: number; skinned: boolean; size: [number, number, number] };
  revoke: () => void;
}
const GENERIC_CLIP = /^(mixamo\.com|take ?0*1|animation|anim|default|armature\|.*|.*\|take ?0*1|clip)$/i;
const baseName = (n: string) => n.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
const expandFiles = async (files: File[]): Promise<{ name: string; blob: Blob }[]> => {
  const out: { name: string; blob: Blob }[] = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) {
      const zip = await JSZip.loadAsync(f);
      const entries = _.filter(_.values(zip.files), (e) => !e.dir && !/__MACOSX/.test(e.name));
      for (const e of entries) out.push({ name: e.name, blob: await e.async(MOTION_TEXT_BLOB) });
    } else out.push({ name: f.name, blob: f });
  }
  return out;
};
const glbUsesDraco = (buf: ArrayBuffer): boolean => {
  try {
    const dv = new DataView(buf);
    const jsonLen = dv.getUint32(12, true);
    const json = new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen));
    return /KHR_draco_mesh_compression|KHR_texture_basisu/.test(json);
  } catch {
    return true;
  }
};
export const loadModelFiles = async (files: File[]): Promise<LoadedModel> => {
  const T = THREE();
  const A = ADD();
  if (!T || !A.GLTFLoader) throw new Error(MOTION_TEXT_ENGINE_3D_CHUA_SAN_SANG);
  const list = await expandFiles(files);
  const main = _.find(list, (x) => /\.glb$/i.test(x.name)) || _.find(list, (x) => /\.gltf$/i.test(x.name)) || _.find(list, (x) => /\.fbx$/i.test(x.name));
  if (!main) throw new Error(MOTION_TEXT_CHON_FILE_GLB_GLTF_FBX_HOAC_ZIP_CHUA);
  const urls = new Map<string, string>();
  const made: string[] = [];
  for (const x of list) {
    const u = URL.createObjectURL(x.blob);
    made.push(u);
    urls.set(x.name.toLowerCase(), u);
    urls.set(x.name.replace(/^.*[\\/]/, "").toLowerCase(), u);
  }
  const manager = new T.LoadingManager();
  manager.setURLModifier((url: string) => {
    if (/^(blob:|data:)/.test(url)) return url;
    const clean = decodeURIComponent(url.replace(/^.*?:\/\/[^/]+\//, "").split(MOTION_TEXT_SYMBOL_25)[0]);
    return urls.get(clean.toLowerCase()) || urls.get(clean.replace(/^.*[\\/]/, "").toLowerCase()) || url;
  });
  const buf = await main.blob.arrayBuffer();
  let scene: any, animations: any[];
  let glb: ArrayBuffer | null = null;
  if (/\.fbx$/i.test(main.name)) {
    const obj = new A.FBXLoader(manager).parse(buf, "");
    scene = obj;
    animations = obj.animations || [];
  } else {
    const loader = new A.GLTFLoader(manager);
    if (A.DRACOLoader) {
      const draco = new A.DRACOLoader();
      draco.setDecoderPath(API_ROUTES.MOTION_REAL_DRACO);
      loader.setDRACOLoader(draco);
    }
    if (A.MeshoptDecoder) loader.setMeshoptDecoder(A.MeshoptDecoder);
    const gltf: any = await new Promise((resolve, reject) => loader.parse(buf, "", resolve, reject));
    scene = gltf.scene;
    animations = gltf.animations || [];
    if (/\.glb$/i.test(main.name) && !glbUsesDraco(buf)) glb = buf;
  }
  animations.forEach((c: any, i: number) => {
    if (!c.name || GENERIC_CLIP.test(c.name)) c.name = animations.length > 1 ? MOTION_TEMPLATE_SYMBOL_12(`${baseName(main.name)}`, `${i + 1}`) : baseName(main.name);
  });
  let meshes = 0,
    triangles = 0,
    bones = 0,
    skinned = false;
  scene.traverse((o: any) => {
    if (o.isMesh) {
      meshes++;
      const g = o.geometry;
      triangles += g?.index ? g.index.count / 3 : (g?.attributes?.position?.count || 0) / 3;
      if (o.isSkinnedMesh) skinned = true;
    }
    if (o.isBone) bones++;
  });
  scene.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(scene);
  const size = box.isEmpty() ? new T.Vector3() : box.getSize(new T.Vector3());
  return { scene, animations, name: baseName(main.name), glb, stats: { meshes, triangles: Math.round(triangles), bones, skinned, size: [size.x, size.y, size.z] }, revoke: () => made.forEach((u) => URL.revokeObjectURL(u)) };
};
export const guessKind = (m: LoadedModel): MotionRealKind => {
  if (!m.stats.meshes && m.animations.length) return MOTION_TEXT_ANIMATION;
  const [x, y, z] = m.stats.size;
  if (m.stats.skinned && m.stats.bones >= 10 && y > Math.max(x, z) * 0.9) return MOTION_TEXT_CHARACTER;
  return MOTION_TEXT_MODEL;
};
export const toGLB = async (m: LoadedModel): Promise<ArrayBuffer> => {
  if (m.glb) return m.glb;
  const A = ADD();
  const exporter = new A.GLTFExporter();
  const out = await exporter.parseAsync(m.scene, { binary: true, animations: m.animations, onlyVisible: false, maxTextureSize: 4096 });
  return out as ArrayBuffer;
};
const bufToBase64 = (buf: ArrayBuffer): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(_.toString(r.result).replace(/^data:[^,]+,/, ""));
    r.onerror = reject;
    r.readAsDataURL(new Blob([buf]));
  });
export const uploadRealModel = async (glb: ArrayBuffer, meta: Record<string, unknown>): Promise<MotionRealAsset> => {
  const r = await motionRequest<{ item: MotionRealAsset }>(API_ROUTES.MOTION_REAL_IMPORT, { meta, base64: await bufToBase64(glb) });
  return r.item;
};
export const ACTION_CLIP_HINTS: Record<string, RegExp> = {
  stand: /idle|breath|stand/i,
  walk: /walk/i,
  run: /run|sprint|jog/i,
  sneak: /sneak|crouch/i,
  sit: /sit/i,
  talk: /talk|convers|explain/i,
  point: /point/i,
  wave: /wave|greet/i,
  look_around: /look|search/i,
  phone: /phone|text/i,
  dig: /dig|shovel/i,
  carry: /carry|box/i,
  push: /push/i,
  fight: /punch|fight|box|attack/i,
  attack: /attack|slash|sword|stab|strike/i,
  charge: /charge|sprint|run/i,
  shoot_bow: /bow|archer|arrow/i,
  cheer: /cheer|celebrat|victory/i,
  die: /death|dying|die/i,
  dance: /danc|samba|hip.?hop/i,
  drive: /driv|sitting/i,
  kneel: /kneel|pray/i,
};
export const guessActionMap = (clips: string[]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [act, re] of _.toPairs(ACTION_CLIP_HINTS)) {
    const hit = _.find(clips, (c) => re.test(c));
    if (hit) out[act] = hit;
  }
  return out;
};
export class RealModelPreview {
  private T = THREE();
  private renderer: any;
  private scene: any;
  private camera: any;
  private holder: any;
  private mixer: any = null;
  private raf = 0;
  private clock: any;
  private yaw = 0;
  private spin = true;
  constructor(private canvas: HTMLCanvasElement) {
    const T = this.T;
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.scene = new T.Scene();
    this.scene.background = new T.Color(MOTION_TEXT_0F141C);
    this.scene.add(new T.HemisphereLight(MOTION_TEXT_E8EEF8, MOTION_TEXT_3A3430, 1.6));
    const sun = new T.DirectionalLight(MOTION_TEXT_FFF4E0, 2.4);
    sun.position.set(-3, 6, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);
    const ground = new T.Mesh(new T.CircleGeometry(40, 48), new T.MeshStandardMaterial({ color: MOTION_TEXT_1B222C, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const grid = new T.GridHelper(20, 20, MOTION_TEXT_2C3646, MOTION_TEXT_222A36);
    grid.position.y = 0.002;
    this.scene.add(grid);
    this.camera = new T.PerspectiveCamera(32, 1, 0.01, 2000);
    this.holder = new T.Group();
    this.scene.add(this.holder);
    this.clock = new T.Clock();
    this.loop();
  }
  setModel(m: LoadedModel, opts: { size?: number; yaw?: number; kind?: MotionRealKind }) {
    const T = this.T;
    while (this.holder.children.length) this.holder.remove(this.holder.children[0]);
    this.mixer = null;
    if (!m.stats.meshes) {
      this.fit(new T.Box3(new T.Vector3(-0.5, 0, -0.5), new T.Vector3(0.5, 1.8, 0.5)));
      return;
    }
    const inner = m.scene;
    inner.position.set(0, 0, 0);
    inner.scale.setScalar(1);
    inner.rotation.set(0, 0, 0);
    inner.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(inner);
    const size = box.getSize(new T.Vector3());
    const ref = opts.kind === MOTION_TEXT_CHARACTER ? size.y : Math.max(size.x, size.y, size.z);
    const s = opts.size && ref > 0 ? opts.size / ref : size.y > 50 ? 0.01 : 1;
    const center = box.getCenter(new T.Vector3());
    const scaler = new T.Group();
    inner.position.set(-center.x, -box.min.y, -center.z);
    scaler.add(inner);
    scaler.scale.setScalar(s);
    scaler.rotation.y = (((opts.yaw || 0) + 90) * Math.PI) / 180;
    this.holder.add(scaler);
    inner.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
    const arrow = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(0, 0.02, 0), Math.max(0.6, size.y * s * 0.6), 0xf2b340, 0.15, 0.1);
    this.holder.add(arrow);
    if (m.animations.length) this.mixer = new T.AnimationMixer(inner);
    this.holder.updateMatrixWorld(true);
    this.fit(new T.Box3().setFromObject(scaler));
  }
  playClip(m: LoadedModel, name?: string) {
    if (!this.mixer) return;
    this.mixer.stopAllAction();
    const clip = _.find(m.animations, (c: any) => c.name === name) || m.animations[0];
    if (clip) this.mixer.clipAction(clip).play();
  }
  setSpin(on: boolean) {
    this.spin = on;
  }
  private fit(box: any) {
    const T = this.T;
    const size = box.getSize(new T.Vector3());
    const c = box.getCenter(new T.Vector3());
    const r = Math.max(size.x, size.y, size.z) * 0.62 + 0.05;
    const d = r / Math.tan((16 * Math.PI) / 180);
    this.camera.position.set(c.x + d * 0.15, c.y + d * 0.3, c.z + d);
    this.camera.lookAt(c);
    this.camera.near = d / 100;
    this.camera.far = d * 20;
    this.camera.updateProjectionMatrix();
  }
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    if (w && h && (this.canvas.width !== Math.round(w * this.renderer.getPixelRatio()) || this.canvas.height !== Math.round(h * this.renderer.getPixelRatio()))) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    const dt = this.clock.getDelta();
    if (this.mixer) this.mixer.update(dt);
    if (this.spin) this.yaw += dt * 0.35;
    this.holder.rotation.y = this.spin ? Math.sin(this.yaw) * 0.6 : 0;
    this.renderer.render(this.scene, this.camera);
  };
  snapshot(w = 256, h = 256): string {
    const c = document.createElement(MOTION_TEXT_CANVAS);
    c.width = w;
    c.height = h;
    const g = c.getContext(MOTION_TEXT_2D)!;
    const src = this.canvas;
    const s = Math.max(w / src.width, h / src.height);
    g.drawImage(src, (w - src.width * s) / 2, (h - src.height * s) / 2, src.width * s, src.height * s);
    return c.toDataURL(MOTION_TEXT_IMAGE_JPEG, 0.86);
  }
  dispose() {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
  }
}
