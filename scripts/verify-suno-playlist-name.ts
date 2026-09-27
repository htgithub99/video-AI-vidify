import assert from "node:assert/strict";
import { formatSunoPlaylistName, normalizeSunoPlaylistName } from "../src/constants/sunoAutomation.js";

assert.equal(
  formatSunoPlaylistName("Đêm Gác Vắng Nghe Tiếng Sáo Trúc Và Những Khúc Bolero Hoài Niệm"),
  "DEM GAC VANG NGHE TIENG SAO | VOL",
);
assert.equal(formatSunoPlaylistName("Mùa thu lá bay", true), "TEST - MUA THU LA BAY");
assert.equal(formatSunoPlaylistName("  "), "PLAYLIST | VOL");
assert.equal(normalizeSunoPlaylistName("đỒI THÔNG"), "DOI THONG");
assert.ok(formatSunoPlaylistName("Bài hát rất dài ".repeat(12)).length < 40);
assert.ok(formatSunoPlaylistName("Bài hát rất dài ".repeat(12), true).length < 40);
assert.equal(formatSunoPlaylistName("English Songs"), "ENGLISH SONGS | VOL");
assert.equal(formatSunoPlaylistName("English Songs", false, "A1B2C3D4E5F6"), "ENGLISH SONGS | VOL-A1B2C3D4E5F6");
assert.equal(formatSunoPlaylistName("Mùa thu lá bay", true, "A1B2C3D4E5F6"), "TEST - MUA THU LA BAY-A1B2C3D4E5F6");
assert.ok(formatSunoPlaylistName("Bài hát rất dài ".repeat(12), false, "A1B2C3D4E5F6").length < 40);
assert.ok(formatSunoPlaylistName("Bài hát rất dài ".repeat(12), true, "A1B2C3D4E5F6").length < 40);

process.stdout.write("Suno playlist names are uppercase, accent-free, and under 40 characters.\n");
