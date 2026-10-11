import { writeVerificationLog } from "./verificationLogger";
import {
  SOURCE_TEXT_1_SONG_MP3,
  SOURCE_TEXT_D_MUSIC_1_SONG_MP3,
  SOURCE_TEXT_D_MUSIC_1_SONG_MP3_2,
  SOURCE_TEXT_D_OTHER_1_SONG_MP3,
  SOURCE_TEXT_DIFFERENT_SOURCE_FILES_SHARING_A_NAME_AND,
  SOURCE_TEXT_ALBUM_SONG_MP3,
  SOURCE_TEMPLATE_D_MUSIC_MP3,
  SOURCE_TEXT_NO_REUSE_ACROSS_FOLDERS_WHEN_THE_SOURCE,
  SOURCE_TEXT_VIDIFY_MIXER_DEDUP,
  SOURCE_TEXT_A_2,
  SOURCE_TEXT_NESTED,
  SOURCE_TEXT_B,
  SOURCE_TEXT_ROOT_MP3,
  SOURCE_TEXT_A_SONG_MP3,
  SOURCE_TEXT_A_NESTED_DEEP_WAV,
  SOURCE_TEXT_B_SONG_MP3,
  SOURCE_TEXT_NOTES_TXT,
  SOURCE_TEXT_NOT_AUDIO,
  SOURCE_TEXT_SRC_SERVER_CONTROLLERS_PIPELINECONTROLLER_TS,
  SOURCE_TEXT_UTF8,
  SOURCE_TEXT_ROUTER_POST_MUSIC_MIXER_SERVER_ROUTE_SELECT,
  SOURCE_TEXT_ROUTER_GET_MUSIC_MIXER_SERVER_ROUTE_SOURCE,
  SOURCE_TEXT_STRING,
  SOURCE_TEXT_UNUSED,
  SOURCE_TEXT_NESTED_FILES_MUST_STILL_BE_DISCOVERED_UNDER,
  SOURCE_TEMPLATE_MUSIC_MIXER_DEDUPLICATION_PASSED_IDENTITY_CASES,
} from "../src/constants/sourceText.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import _ from "lodash";
import * as sourceTexts from "../src/constants/sourceText.ts";
import { MUSIC_MIXER_SERVER } from "../src/constants/musicMixer.ts";
import { deduplicateMusicMixerTracks, distributeMusicMixerTracks, getMusicMixerTrackKey } from "../src/services/musicMixerTracks.ts";
const track = (sourcePath: string, lastModified = 1) => ({ sourcePath, path: SOURCE_TEXT_1_SONG_MP3, file: { size: 0, lastModified } });
const original = track(SOURCE_TEXT_D_MUSIC_1_SONG_MP3);
const repeated = track(SOURCE_TEXT_D_MUSIC_1_SONG_MP3_2, 99);
assert.equal(getMusicMixerTrackKey(original), getMusicMixerTrackKey(repeated));
assert.deepEqual(deduplicateMusicMixerTracks([original, repeated, original]), [original]);
assert.equal(deduplicateMusicMixerTracks([original, track(SOURCE_TEXT_D_OTHER_1_SONG_MP3)]).length, 2, SOURCE_TEXT_DIFFERENT_SOURCE_FILES_SHARING_A_NAME_AND);
const browserFile = { path: SOURCE_TEXT_ALBUM_SONG_MP3, file: { size: 123, lastModified: 456 } };
assert.equal(deduplicateMusicMixerTracks([browserFile, { ...browserFile, file: { ...browserFile.file } }]).length, 1);
assert.equal(deduplicateMusicMixerTracks([browserFile, { ...browserFile, file: { size: 999, lastModified: 456 } }]).length, 2);
assert.throws(() => distributeMusicMixerTracks([original, repeated], 2, 3), /insufficient_unique_tracks/);
let distributions = 0;
for (let count = 1; count <= 30; count++) {
  const source = Array.from({ length: count }, (_, index) => track(SOURCE_TEMPLATE_D_MUSIC_MP3(`${index}`)));
  for (let songs = 1; songs <= count; songs++) {
    for (const folderCount of [1, 2, 3, 5, 10]) {
      const folders = distributeMusicMixerTracks([...source, ...source.map((item) => ({ ...item }))], songs, folderCount);
      assert.equal(folders.length, folderCount);
      for (const folder of folders) {
        assert.equal(folder.length, songs);
        assert.equal(new Set(folder.map(getMusicMixerTrackKey)).size, songs);
      }
      if (songs * folderCount <= count) {
        assert.equal(new Set(folders.flat().map(getMusicMixerTrackKey)).size, songs * folderCount, SOURCE_TEXT_NO_REUSE_ACROSS_FOLDERS_WHEN_THE_SOURCE);
      }
      distributions++;
    }
  }
}
const directory = await fs.promises.mkdtemp(path.join(tmpdir(), SOURCE_TEXT_VIDIFY_MIXER_DEDUP));
try {
  await fs.promises.mkdir(path.join(directory, SOURCE_TEXT_A_2, SOURCE_TEXT_NESTED), { recursive: true });
  await fs.promises.mkdir(path.join(directory, SOURCE_TEXT_B));
  for (const relative of [SOURCE_TEXT_ROOT_MP3, SOURCE_TEXT_A_SONG_MP3, SOURCE_TEXT_A_NESTED_DEEP_WAV, SOURCE_TEXT_B_SONG_MP3]) {
    await fs.promises.writeFile(path.join(directory, relative), relative);
  }
  await fs.promises.writeFile(path.join(directory, SOURCE_TEXT_NOTES_TXT), SOURCE_TEXT_NOT_AUDIO);
  const controller = await fs.promises.readFile(SOURCE_TEXT_SRC_SERVER_CONTROLLERS_PIPELINECONTROLLER_TS, SOURCE_TEXT_UTF8);
  const start = controller.indexOf(SOURCE_TEXT_ROUTER_POST_MUSIC_MIXER_SERVER_ROUTE_SELECT);
  const end = controller.indexOf(SOURCE_TEXT_ROUTER_GET_MUSIC_MIXER_SERVER_ROUTE_SOURCE, start);
  assert.ok(start >= 0 && end > start);
  let handler: any;
  const sandbox = vm.createContext({
    fs,
    path,
    _,
    randomUUID,
    MUSIC_MIXER_SERVER,
    ...sourceTexts,
    MOTION_TEXT_STRING: SOURCE_TEXT_STRING,
    parseJson: JSON.parse,
    musicMixerSources: new Map(),
    musicMixerAllowedSources: new Set(),
    MUSIC_MIXER_SOURCE_TTL_MS: 1,
    getPythonCommand: () => SOURCE_TEXT_UNUSED,
    getStaticResourcePath: (value: string) => value,
    logger: {
      error: (message: string) => {
        throw new Error(message);
      },
    },
    setTimeout: () => ({ unref() {} }),
    router: {
      post: (_route: string, callback: any) => {
        handler = callback;
      },
    },
    execFile: (_command: string, _args: string[], _options: object, callback: any) => {
      void callback(null, JSON.stringify([directory, directory]), "");
    },
  });
  vm.runInContext(
    ts.transpileModule(controller.slice(start, end), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText,
    sandbox,
  );
  const result: any = await new Promise((resolve, reject) => {
    handler({}, { json: resolve, status: () => ({ json: reject }) });
  });
  assert.equal(result.success, true);
  assert.equal(result.folders.length, 3);
  const files = result.folders.flatMap((folder: any) => folder.files);
  assert.equal(files.length, 4);
  assert.equal(new Set(files.map((file: any) => file.sourcePath)).size, 4);
  const parent = result.folders.find((folder: any) => folder.folderPath === directory);
  assert.deepEqual(
    Array.from(parent.files, (file: any) => file.name),
    [SOURCE_TEXT_ROOT_MP3],
  );
  const nested = result.folders.find((folder: any) => folder.folderPath === path.join(directory, SOURCE_TEXT_A_2));
  assert.equal(nested.files.length, 2, SOURCE_TEXT_NESTED_FILES_MUST_STILL_BE_DISCOVERED_UNDER);
  writeVerificationLog(SOURCE_TEMPLATE_MUSIC_MIXER_DEDUPLICATION_PASSED_IDENTITY_CASES(`${distributions}`));
} finally {
  await fs.promises.rm(directory, { recursive: true, force: true });
}
