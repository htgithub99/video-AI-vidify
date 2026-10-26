# Music cover prompt triggers image generation during planning

## Flow checked

`MusicCreator.handleGenerate` / `handleRegenerateThumbnail` ->
`POST /api/pipeline/music-thumbnail` -> `generateMusicThumbnailAsset` ->
`buildMusicImagePromptPlanningPrompt` -> `generatePlanningWithChatUi` ->
validate `{ artifactType, requestId, imagePrompt }` -> `generateImageWithPlaywright`.

The note-normalization wand uses a separate endpoint and only updates the note.
The first planning request has no image attachments. The reference image is
attached in the later image-generation step.

## Root cause found in the outgoing planning prompt

The planner was told to return JSON, but the appended brief contained direct
execution commands: “Create a finished professional…” and, in shared rules,
“Return the finished image, not an explanation.” The brief was appended as plain
text without a quoted data boundary. Consequently the same request instructed
Gemini both to write a prompt and to produce an image. The planner also lacked
an explicit instruction prohibiting image generation.

The cover and video background shared this conflict. JSON validation occurs
after the provider responds and cannot stop Gemini from choosing an image tool.

## Runtime evidence and limits

`storage/logs/music-workflow.jsonl` shows:

- 2026-10-25 13:10:50–13:12:01 (Asia/Saigon): cover planning succeeded and
  returned a 1,183-character image prompt before entering image generation.
- 2026-10-25 13:14:30–13:15:30: another cover request failed in
  `music_image_prompt`, with `GeminiChatRequestRejected:8:1095` /
  `chat_planning_provider_error_response`. It did not reach the subsequent
  image-generation step.

The log proves the failing stage, but does not record the generated media or
establish the undocumented meaning of provider error codes. The conflicting
instructions are independently reproducible from the local prompt builders.

## Fix

- Convert finished-image commands in the brief into visual specifications.
- Start planning with an explicit text-only task and prohibit image tool calls.
- Quote the whole brief as JSON data and repeat the output contract after it.
- Preserve note wording, market, reference policy and exact downloaded titles.
- Quote the original note in the normalization task and repeat its text-only rule.

## Verification

- `npx tsx scripts/verify-music-image-planning.ts`: passed for covers with and
  without references, backgrounds with and without track lists, and both note
  normalization purposes.
- `npx tsx scripts/verify-chat-response-snapshots.ts`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npx tsx scripts/verify-music-source-composition.ts`: fails on an existing
  lyrics assertion (`complete performance-ready lyrics of at least 300 characters
  with Suno section labels`); the asserted phrase is absent in HEAD too.

## Follow-up: running backend had retained the old prompt

The user's subsequent pasted request (request ID
`music-image-prompt-7e916fc0-4160-4d0c-b147-89dfce9f3896`) still contained the old
unquoted `IMAGE BRIEF` and `Return the finished image` instruction. It had none
of the new text-only task boundaries.

The backend process started at 12:25:45, before the prompt source was edited at
13:18:54. Its command was `node --dns-result-order=ipv4first --import tsx server.ts`
without watch mode. Source changes therefore did not reload its imported modules.
The first investigation verified source code but missed activating the fix in
the running backend.

After the current cover job finished, the backend was restarted at 13:31:19.
The music page was reloaded and its existing cover note/reference were retained.
The cover prompt revision is now included in `music_image_prompt_started`
diagnostics so stale processes can be identified directly.

A real request from the application's **Tạo lại** button then showed:

- 13:33:00: `music_image_prompt_started`, revision
  `2026-10-25-text-only-v1`, request ID
  `music-image-prompt-1f7cfec2-7ea3-4ced-bac4-e2d2eaac27d2`.
- 13:34:06: validated JSON response, with a 1,098-character `imagePrompt`.
- Only after that validation: `music_image_generation_requirements` and
  `MusicThumbnail start attempt=1/5`, entering the separate image-generation step.

This confirms the corrected prompt is active and the live planning request
returns the expected text contract. It does not prove that every future provider
response will behave identically. The later image-generation step initially
retried because its model picker was not found, then succeeded on the third room.

## Additional download defect found during live verification

The existing cover preview was broken (`naturalWidth: 0`). Inspecting only its
DOM image metadata showed a `data:image/png` URL whose decoded bytes started
with `<!doctype html>`. The downloader had accepted any sufficiently large HTTP
200 body, and the cover endpoint classified every non-JPEG response as PNG.

The extraction paths now reject non-image HTTP content types and validate the
downloaded raster file signature before accepting bytes. The cover endpoint also
checks the signature and derives its real MIME type. Invalid HTML can therefore
fall through to the existing canvas/button-download alternatives instead of
being saved as a successful image. PNG, JPEG, WebP and GIF remain supported.

`npx tsx scripts/verify-image-media-download.ts` passes the regression cases:
large HTML, large JSON, empty/unrecognized bytes and truncated signatures are
rejected; supported raster signatures are recognized.

### Final live result after download validation

The backend was reloaded with both fixes and a second real request was sent
from **Tạo lại**, retaining the user's original note, reference and song list.
Request `music-image-prompt-7b5355b6-5c1b-4d70-9a9c-4ad27feca8bb` used the new
revision and returned validated JSON at 13:43:57 with a 1,309-character prompt.
The separate image-generation step then completed. DOM verification of the
resulting cover confirmed `data:image/jpeg`, `complete: true`, natural width
1,024 and natural height 572. The old invalid preview was replaced successfully.
Screenshots: `scratch/music-cover-live-result.png` and
`scratch/music-cover-live-panel.png`. TypeScript checks also pass with both fixes.
