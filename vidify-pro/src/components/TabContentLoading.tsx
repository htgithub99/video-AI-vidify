import _ from "lodash";
import { TAB_CONTENT_LOADING_CONFIG } from "../constants";

export default function TabContentLoading() {
  return (
    <div
      aria-busy
      className="h-full w-full overflow-hidden bg-slate-955 p-4 sm:p-6 lg:p-8 animate-pulse"
    >
      <div className="mx-auto grid h-full max-w-[1800px] grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 h-5 w-44 rounded bg-slate-800" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-20 rounded-xl bg-slate-800/70" />
              <div className="h-20 rounded-xl bg-slate-800/50" />
            </div>
            <div className="mt-5 h-44 rounded-xl bg-slate-800/60" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 h-4 w-36 rounded bg-slate-800" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {_.map(TAB_CONTENT_LOADING_CONFIG.ROWS, (row) => (
                <div key={row} className="h-12 rounded-xl bg-slate-800/60" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 xl:col-span-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mx-auto mb-6 h-5 w-40 rounded bg-slate-800" />
            <div className="h-12 rounded-xl bg-slate-800/70" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 h-4 w-32 rounded bg-slate-800" />
            <div className="space-y-4">
              {_.map(TAB_CONTENT_LOADING_CONFIG.ROWS, (row) => (
                <div key={row} className="space-y-2">
                  <div className="h-3 w-1/3 rounded bg-slate-800" />
                  <div className="h-10 rounded-xl bg-slate-800/60" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
