export const CHAT_SUBMISSION_VERIFICATION = {
  ENTRY: 'export { submitPrompt, getComposerReadings, getLastVisibleLocator, clickSendButton }; export { CINEMATIC_CHAT_PLANNING_CONFIG as config } from "../../constants/cinematicConstants.js"; export { MOTION_AI_RECOVERY as recoveryConfig } from "../../constants/motionAiRecovery.js";',
  OVERLAY_DOCUMENT: '<button id="send" style="position:absolute;left:20px;top:20px;width:120px;height:40px" onclick="window.sendCount++">Send</button><div id="overlay" style="position:fixed;inset:0;z-index:100"></div><script>window.sendCount=0;setTimeout(()=>document.querySelector("#overlay").remove(),350)</script>',
  OVERLAY_SEND: "#send",
  STREAM_PATH: "/StreamGenerate",
  STREAM_ERROR: ')]}\'\n\n121\n[["wrb.fr",null,null,null,null,[8,null,[["type.googleapis.com/assistant.boq.bard.application.BardErrorInfo",[1095]]]]]]\n25\n[["e",4,null,null,214]]\n',
  STREAM_SUCCESS: '[["wrb.fr",null,"response data",null,null,null]]',
  STREAM_INCOMPLETE: '[["wrb.fr",null,null',
  STREAM_ERROR_NAME: "GeminiChatRequestRejected:8:1095",
  STREAM_DOCUMENT:
    '<input-area-v2 style="display:block"><rich-textarea style="display:block"><div contenteditable="true" class="ql-editor"></div></rich-textarea><button aria-label="Send message">Send</button></input-area-v2><div class="answer"></div><script>window.sendCount=0;document.querySelector("button").onclick=async()=>{window.sendCount++;const editor=document.querySelector(".ql-editor");const saved=editor.textContent;editor.textContent="";await fetch("/StreamGenerate",{method:"POST"});editor.textContent=saved;};</script>',
  SOURCE: "src/server/services/chatUiPlanningService.ts",
  SOURCE_PATTERN: /chatUiPlanningService\.ts$/,
  PLUGIN: "isolated-chat-submission",
  CLICK: "await clickSendButton(page, sendButton, signal);",
  INJECT: "await clickSendButton(page, sendButton, signal); if (globalThis.__chatSubmissionFail) throw new Error('injected-after-send');",
  FAIL: "injected-after-send",
  BUNDLE: (pid: number) => `node_modules/.cache/chat-submission-${pid}.mjs`,
  STORAGE: (pid: number) => `scratch/chat-submission-${pid}`,
  INPUT: "textarea",
  SEND: "button",
  RESPONSE: ".answer",
  BUSY: ".busy",
  COUNTER: "window.sendCount",
  ROOM: "submission-fixture",
  ARTIFACT: "motion-puppet-character",
  REQUEST: "submission-current",
  OLD: "submission-previous",
  PROMPT: 'Return JSON with artifactType "motion-puppet-character" and requestId "submission-current".',
  DOCUMENT: `<textarea></textarea><button>Send</button><div class="answer"></div><script>
    window.sendCount = 0;
    document.querySelector('button').onclick = () => { window.sendCount++; };
  </script>`,
  CONTEXT_TEXT: "Đây là nguồn dài, cần giữ nguyên cả dấu tiếng Việt và thứ tự chi tiết. ",
  CONTEXT_PATH: "/",
  CONTEXT_DOCUMENT: `<textarea></textarea><button>Send</button><div class="answer"></div><script>
    window.messages=[];window.parts=[];
    document.querySelector('button').onclick=()=>{
      const text=document.querySelector('textarea').value;window.messages.push(text);
      const receipt=text.match(/For this message only return raw JSON: (.*)/);
      const part=text.match(/<request-part>\\n([\\s\\S]*)\\n<\\/request-part>/);
        if(part)window.parts.push(part[1]);
        history.pushState({},'', '/c/offline-context?rid='+window.messages.length);
      document.querySelector('textarea').value='';
      document.querySelector('.answer').textContent=receipt?JSON.stringify(JSON.parse(receipt[1])):window.fixtureResponse;
    };
  </script>`,
  GEMINI_DOCUMENT: `<style>input-area-v2,uploader-file-preview-container,uploader-file-preview{display:block}</style><input type="file" id="unrelated"><input-area-v2><uploader-file-preview-container><uploader-file-preview><span>stale</span><button aria-label="close stale" onclick="this.parentElement.remove()">x</button></uploader-file-preview></uploader-file-preview-container><rich-textarea><div class="ql-editor" contenteditable="true"></div><div class="ql-clipboard" contenteditable="true" style="position:absolute;left:-10000px;width:1px;height:1px"></div></rich-textarea><input type="file" id="reference-files" multiple><button aria-label="Send message">Send</button></input-area-v2><div class="answer"></div><script>
    window.sendCount=0;window.uploadFails=true;
    document.querySelector('#reference-files').onchange=function(){
      for(const file of this.files){const chip=document.createElement('uploader-file-preview');chip.innerHTML='<span>'+file.name.replace(/\\.png$/,'')+'</span><button aria-label="close '+file.name.replace(/\\.png$/,'')+'" onclick="this.parentElement.remove()">x</button>';if(window.uploadFails)chip.className='gem-attachment-loading-error';document.querySelector('uploader-file-preview-container').append(chip)}
      document.querySelector('[aria-label="Send message"]').disabled=window.uploadFails;
    };
    document.querySelector('[aria-label="Send message"]').onclick=()=>{window.sendCount++;document.querySelector('.answer').textContent=window.fixtureResponse};
  </script>`,
  GEMINI_REFERENCE_NAME: "prop_00.png",
  GEMINI_REFERENCE_MIME: "image/png",
  GEMINI_REFERENCE_BASE64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPd8AAAAASUVORK5CYII=",
  GEMINI_FILES: "#reference-files",
  GEMINI_EDITOR: ".ql-editor",
  GEMINI_CLIPBOARD: ".ql-clipboard",
  LAYOUT_READ_ERROR: "composer-layout-read-forbidden",
  LAYOUT_PROPERTY: "innerText",
  RECTS_PROPERTY: "getClientRects",
  UNRELATED_FILES: "#unrelated",
  NETWORK: "**/*",
  HOST: "127.0.0.1",
  CONTENT_TYPE: "Content-Type",
  HTML_TYPE: "text/html; charset=utf-8",
  LOCAL_ROOM: (port: number): string => `http://127.0.0.1:${port}/app/submission-fixture`,
  RELOADED_DOCUMENT: (response: unknown): string => `<textarea></textarea><button>Send</button><div class="answer">${JSON.stringify(response)}</div>`,
  EMPTY: "",
  CANCELLED: /cancelled/i,
  PASSED: "Real chat submission passed: one click after uncertain send, read-only resume, delayed response with retained composer, stale response rejection and closed-page protection. No external requests.\n",
} as const;
