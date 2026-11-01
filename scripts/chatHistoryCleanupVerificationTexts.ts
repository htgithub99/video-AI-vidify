export const CHAT_HISTORY_FIXTURE = {
  PASSED: "Verified all-history cleanup: Gemini, Grok, ChatGPT; delayed confirmation, empty/hidden history, server errors, wrong dialogs and unconfirmed deletions.\n",
  HTML: (provider: string, mode: string, language: string): string => {
    const vi = language === "vi";
    const gemini = provider === "gemini";
    const grok = provider === "grok";
    const remove = vi ? "Xóa" : "Delete";
    const all = grok ? (vi ? "Xóa tất cả cuộc trò chuyện" : "Delete all conversations") : vi ? "Xóa tất cả" : "Delete all";
    const heading = grok ? (vi ? "Xóa tất cả cuộc trò chuyện?" : "Delete all conversations?") : vi ? "Xoá tất cả trò chuyện?" : "Delete all chats?";
    return `<!doctype html><html><head><meta charset="utf-8"></head><body>
      ${gemini ? (mode === "empty" ? `<p>${vi ? "Không có hoạt động nào" : "No activity"}</p>` : `<button id="bulk">${remove}</button>`) : `<section role="dialog" id="settings"><h1>${vi ? "Kiểm soát dữ liệu" : "Data controls"}</h1><button>${vi ? "Lưu trữ tất cả" : "Archive all"}</button><button id="bulk">${all}</button><button>${vi ? "Xóa tất cả dữ liệu Imagine" : "Delete all Imagine data"}</button><button id="account" onclick="window.events.push('account')">${remove}</button></section>`}
      <script>
      const mode=${JSON.stringify(mode)}, gemini=${gemini}, grok=${grok}; window.events=[];
      const dialog=()=>{
        const el=document.createElement('section'); el.setAttribute('role',grok?'alertdialog':'dialog');
        el.innerHTML='<h2>'+ (mode==='wrong'?'Delete account?':${JSON.stringify(gemini ? (vi ? "Xác nhận bạn muốn xóa" : "Confirm you want to delete") : heading)})+'</h2><button id="confirm">'+${JSON.stringify(gemini || grok ? remove : all)}+'</button>'; (mode==='nested'?document.querySelector('#settings'):document.body).append(el);
        el.querySelector('button').onclick=async()=>{
          window.events.push('confirm');
          if(mode==='vanish'){el.remove();return;}
          if(gemini){if(mode!=='stuck'){el.remove();document.body.insertAdjacentHTML('beforeend','<p>'+${JSON.stringify(vi ? "Đã xóa xong" : "Deletion complete")}+'</p>');}return;}
          const route=mode==='single'?'/rest/conversations/single-id':grok?'/rest/conversations/delete-all':'/backend-api/conversations';
          const r=await fetch(route,{method:grok?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_visible:false})});
          if(mode!=='stuck')el.remove();
        };
      };
      const bulk=document.querySelector('#bulk'); if(bulk)bulk.onclick=()=>{
        window.events.push('bulk');
        if(gemini){const menu=document.createElement('div');menu.innerHTML='<button role="menuitem" id="day">'+${JSON.stringify(vi ? "Một ngày qua" : "Last day")}+'</button><button role="menuitem" id="all">'+${JSON.stringify(vi ? "Từ trước đến nay" : "All time")}+'</button>';document.body.append(menu);menu.querySelector('#day').onclick=()=>window.events.push('day');menu.querySelector('#all').onclick=()=>{window.events.push('all');menu.remove();setTimeout(dialog,80);};}
        else setTimeout(dialog,80);
      };
      </script></body></html>`;
  },
} as const;
