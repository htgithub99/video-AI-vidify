import { cn } from "../lib/utils";
import { useState } from "react";
import { PipelineNode, pipelineNodes } from "../constants";
import { Lang, translations } from "../lib/lang.js";
import { HelpCircle, Activity, Sparkles } from "lucide-react";
import { Button } from "./ui/Button";

interface PipelineFlowchartProps {
  currentLang: Lang;
  activeStepIndex: number;
  onNavigateStep?: (stepIdx: number) => void;
}

export default function PipelineFlowchart({ currentLang, activeStepIndex, onNavigateStep }: PipelineFlowchartProps) {
  const [selectedNode, setSelectedNode] = useState<PipelineNode | null>(null);
  const t = translations[currentLang];

  const getGroupName = (groupId: number) => {
    const groups: Record<number, string> = {
      0: t.Inputs,
      1: t.Hook_Engine,
      2: t.Story_Expansion,
      3: t.Storyboard,
      4: t.Visuals,
      5: t.Audio_Sync,
      6: t.SEO_Boost,
      7: t.Video_Editorial,
    };
    return groups[groupId] || "";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
          <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase font-mono">{t.viewPipelineMap}</h3>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono uppercase font-bold">
          <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          <span>{t.Click_any_node_to_view_de}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {pipelineNodes.map((node, idx) => {
          const isActiveGroup = node.stageGroup === activeStepIndex;
          const isPassedGroup = node.stageGroup < activeStepIndex;

          return (
            <Button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              variant="ghost"
              size="xs"
              className={cn(`p-2.5 rounded text-left transition-all duration-300 relative group overflow-hidden cursor-pointer flex-col items-start justify-start gap-1 h-auto w-full shadow-none ${
                isActiveGroup ? "bg-rose-950/20 border-rose-500 text-rose-100 ring-1 ring-rose-500/30" : isPassedGroup ? "bg-[#0f1d16] border-green-500/30 text-green-300 hover:border-green-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-[#444] hover:bg-slate-850"
              }`)}
            >
              {isActiveGroup && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}

              <div className="text-[9px] font-mono font-bold tracking-wider opacity-60 flex items-center justify-between mb-1 w-full">
                <span>
                  {t.STAGE_0}
                  {node.stageGroup + 1}
                </span>
                <span className={isActiveGroup ? "text-rose-400" : isPassedGroup ? "text-green-400" : "text-slate-400"}>{node.id}</span>
              </div>
              <p className="text-xs font-semibold truncate uppercase tracking-tight w-full text-left">{currentLang === "vi" ? node.nameVi : node.nameEn}</p>

              <div className="mt-1.5 pt-1.5 border-t border-slate-800/50 text-[8px] text-slate-500 uppercase font-bold truncate flex items-center gap-1 font-mono justify-between w-full">
                <span>{getGroupName(node.stageGroup)}</span>
                <HelpCircle className="w-3 h-3 text-slate-600 group-hover:text-rose-400" />
              </div>
            </Button>
          );
        })}
      </div>

      {selectedNode && (
        <div className="mt-4 bg-slate-950 border border-slate-800 rounded p-4 animate-fadeIn flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-800 rounded text-rose-400 shrink-0 font-mono font-black text-xs border border-slate-800">{selectedNode.id}</div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold bg-slate-800 font-mono px-2 py-0.5 rounded text-green-400 border border-slate-800">
                  {t.STAGE_0}
                  {selectedNode.stageGroup + 1} : {getGroupName(selectedNode.stageGroup)}
                </span>
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">{currentLang === "vi" ? selectedNode.nameVi : selectedNode.nameEn}</h4>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">{currentLang === "vi" ? selectedNode.descVi : selectedNode.descEn}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {onNavigateStep && selectedNode.stageGroup !== activeStepIndex && (
              <Button
                onClick={() => {
                  onNavigateStep(selectedNode.stageGroup);
                  setSelectedNode(null);
                }}
                variant="primary"
                size="sm"
                className="text-[10px] uppercase font-mono font-bold"
                title={t.Navigate_to_this_stage}
              >
                {t.Jump_to_this_step}
              </Button>
            )}
            <Button 
              onClick={() => setSelectedNode(null)} 
              variant="secondary"
              size="sm"
              className="text-[10px] uppercase font-mono font-bold"
            >
              {t.Close}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
