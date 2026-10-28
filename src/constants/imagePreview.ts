export const IMAGE_PREVIEW = {
  OVERLAY: "fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150",
  CONTENT: "relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-955 flex items-center justify-center",
  IMAGE: "max-w-full max-h-[85vh] object-contain rounded-2xl select-none",
  CLOSE: "btn-icon-tiny absolute top-3 right-3 w-9 h-9 min-w-[36px] max-w-[36px] min-h-[36px] max-h-[36px] !p-0 aspect-square rounded-xl bg-black/70 hover:bg-black/95 text-white flex items-center justify-center border border-white/30 backdrop-blur-md shadow-xl transition-all cursor-pointer active:scale-95",
  ICON: "w-5 h-5 stroke-[2.5] shrink-0",
} as const;
