export const GEMINI_ACTIVITY_FIXTURE = {
  ENTRY: 'export * from "./src/server/services/geminiActivityCleanupService.ts";',
  MODE: { CONFIRM: "confirm", DIRECT: "direct", EMPTY: "empty", WRONG: "wrong", STUCK: "stuck" },
  HTML: (mode = "confirm", language = "vi"): string => `<!doctype html><html><head><meta charset="utf-8"></head><body><h1>Gemini Activity</h1><button id="delete">${language === "vi" ? "Xóa" : "Delete"}</button>${mode === "empty" ? "<p>Không có hoạt động nào.</p>" : ""}<script>
    const mode=${JSON.stringify(mode)}, language=${JSON.stringify(language)};
    window.events=[];window.events.push=(...events)=>{Array.prototype.push.apply(window.events,events);void window.record?.(events);return window.events.length;};
    document.querySelector('#delete').onclick=()=>{window.events.push('open');const menu=document.createElement('div');menu.setAttribute('role','dialog');menu.innerHTML='<h2>Xóa hoạt động</h2><button role="menuitem" id="hour">Một giờ qua</button><button role="menuitem" id="all">Từ trước đến nay</button>'+(mode==='wrong'?'':'<button role="menuitem" id="day">'+(language==='vi'?'Một ngày qua':'Last day')+'</button>');document.body.append(menu);
      menu.querySelector('#all').onclick=()=>window.events.push('all');menu.querySelector('#hour').onclick=()=>window.events.push('hour');
      const complete=()=>{const result=document.createElement('div');result.setAttribute('role','dialog');result.innerHTML='<h2>'+(language==='vi'?'Đã xóa xong':'Deletion complete')+'</h2><button>OK</button>';document.body.append(result);window.events.push('deleted');};
      const day=menu.querySelector('#day');if(day)day.onclick=()=>{window.events.push('day');menu.remove();if(mode==='direct'){complete();return;}const confirm=document.createElement('div');confirm.setAttribute('role','dialog');confirm.innerHTML='<h2>'+(language==='vi'?'Xác nhận bạn muốn xóa':'Confirm you want to delete')+'</h2><button>'+(language==='vi'?'Xóa':'Delete')+'</button>';document.body.append(confirm);confirm.querySelector('button').onclick=()=>{window.events.push('confirm');confirm.remove();if(mode!=='stuck')complete();};};
    };
  </script></body></html>`,
  PASSED: "Gemini activity cleanup passed: last-day-only deletion, confirmation, no activity, cancellation, bounded failures, shared-task deferral, duplicate close protection and new-request exclusion.\n",
} as const;
