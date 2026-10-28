import assert from "node:assert/strict";
import { getDownloadedImageMimeType } from "../src/server/utils/imageMedia.ts";
for (const invalid of [Buffer.from('<!doctype html><html lang="vi">' + "login".repeat(10000)), Buffer.from('{"error":"authentication required"}' + " ".repeat(20000)), Buffer.from("89504e470d0a1a0a", "hex"), Buffer.alloc(20000)]) assert.equal(getDownloadedImageMimeType(invalid), undefined);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=", "base64");
assert.equal(getDownloadedImageMimeType(png), "image/png");
assert.equal(getDownloadedImageMimeType(Buffer.from("ffd8ffe000104a464946000101000001", "hex")), "image/jpeg");
assert.equal(getDownloadedImageMimeType(Buffer.from("52494646180000005745425056503820", "hex")), "image/webp");
assert.equal(getDownloadedImageMimeType(Buffer.from("47494638396101000100800000ffffff", "hex")), "image/gif");
process.stdout.write("Image downloads reject HTML/JSON and identify PNG, JPEG, WebP and GIF bytes.\n");
