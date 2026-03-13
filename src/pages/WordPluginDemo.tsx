import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTour } from "@/contexts/TourContext";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  ChevronDown,
  Search,
  X,
  Settings,
  RotateCcw,
  Plus,
  FileText,
  Zap,
  Mic,
  MessageSquareText,
  Database,
  Info,
} from "lucide-react";

const questionnaireLines = [
  "Please ensure response address Vanguard mandates managed in all regions (as applicable).",
  "Firm Overview / Governance",
  "1. Please provide a brief description of the organization, including history, leadership, AUM across asset classes, and client types, office location(s), and organizational structure.",
  "2. Provide an overview (including chart) of the ownership structure of the Firm, its relevant investment advisers, affiliates, and any parent organization. Include details on ownership changes during the past 10 years.",
  "3. Please describe key strategic business objectives for the firm over the next 5 years and any material changes to the organizational structure.",
  "4. Who is responsible for setting long-term strategy for the firm? Please list key individuals and committees and how decisions are made.",
  "5. Please provide organizational charts for firm Leadership / Governance as well as Investment, Trading, Risk and Compliance, Operations, IT, and any additional teams supporting the Vanguard portfolio(s).",
  "6. Please highlight recent or upcoming changes to key personnel.",
  "7. Please provide an overview of key oversight / governance committees, including their purpose, members, frequency of meetings and any upcoming changes to the committee structure or process.",
  "8. Please list all key service providers and how oversight and incentive alignment is managed.",
];

const ribbonTools = [
  "Paste",
  "Cut",
  "Copy",
  "Format Painter",
  "Styles",
  "Editor",
  "Add-ins",
];

export default function WordPluginDemo() {
  const { isActive, steps, currentStepIndex } = useTour();
  const currentStepId = isActive ? steps[currentStepIndex]?.id : undefined;
  const isBulkView = currentStepId === "word-plugin-bulk-answer";
  const isImproveView = currentStepId === "word-plugin-improve";

  return (
    <div className="h-screen w-full bg-[#f3f3f5] flex flex-col text-[#1f1f1f]">
      <header className="bg-white border-b border-[#e5e5e5]">
        <div className="h-8 px-3 flex items-center justify-between text-[11px] text-[#6a6a6a]">
          <div className="flex items-center gap-3">
            <span className="font-medium">AutoSave</span>
          </div>
          <div className="font-medium text-[#3f3f3f]">Vanguard Questionnaire_Example</div>
          <div className="inline-flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            <span>Search (Cmd + Ctrl + U)</span>
          </div>
        </div>

        <div className="h-8 px-3 flex items-center gap-4 border-t border-[#f0f0f0] text-[12px]">
          {["Home", "Insert", "Draw", "Design", "Layout", "References", "Mailings", "Review", "View", "Acrobat"].map((tab) => (
            <button
              key={tab}
              className={`pb-1 ${tab === "Home" ? "border-b-2 border-[#2b579a] font-semibold text-[#111]" : "text-[#555]"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-3 py-2 border-t border-[#f0f0f0] flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 border-r border-[#e8e8e8] pr-2 mr-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2">Times New...</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2">14</Button>
          </div>

          <Button variant="outline" size="icon" className="h-7 w-7"><Bold className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7"><Italic className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7"><Underline className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7"><List className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7"><ListOrdered className="h-3.5 w-3.5" /></Button>

          <div className="h-6 w-px bg-[#e8e8e8] mx-1" />

          {ribbonTools.map((tool) => (
            <Button key={tool} variant="ghost" size="sm" className="h-7 text-[11px] text-[#444]">
              {tool}
            </Button>
          ))}

          <div className="h-6 w-px bg-[#e8e8e8] mx-1" />
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-[#444]">
            <Mic className="h-3.5 w-3.5 mr-1" />
            Dictate
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <section className="flex-1 min-w-0 overflow-auto px-10 py-6">
          <div className="mx-auto w-[8.5in] min-h-[11in] bg-white border border-[#dddddd] shadow-sm px-[84px] py-[72px]">
            <div className="text-center mb-7">
              <h1 className="text-[36px] leading-tight font-semibold font-serif">The Vanguard Group</h1>
              <h2 className="text-[32px] leading-tight font-semibold font-serif">Compliance Due Diligence Questionnaire</h2>
            </div>

            <div className="space-y-4 text-[18px] leading-[1.45] font-serif text-[#222]">
              {questionnaireLines.map((line, idx) => (
                <p
                  key={idx}
                  className={
                    line === "Firm Overview / Governance"
                      ? "font-semibold italic underline mt-2"
                      : ""
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        <aside
          data-tour-id="word-plugin-panel"
          className="w-[360px] bg-white border-l border-[#e3e3e3] px-3 py-2 flex flex-col"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-[18px]">AdviserGPT</div>
            <div className="inline-flex items-center gap-2">
              <button className="h-6 w-6 rounded bg-[#ebebeb] inline-flex items-center justify-center">
                <Info className="h-3.5 w-3.5 text-[#666]" />
              </button>
              <X className="h-4 w-4 text-[#7b7b7b]" />
            </div>
          </div>

          <div className="rounded-md border border-[#e4e4e4] p-2 mb-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[12px]">[DEMO] Granite Peak Asset Management</div>
              <Settings className="h-3.5 w-3.5 text-[#777]" />
            </div>
            <div className="grid grid-cols-3 mt-2 rounded-md border border-[#e8e8e8] overflow-hidden text-[11px]">
              <button className={`h-7 font-medium ${isImproveView ? "bg-white text-[#666]" : "bg-[#f5f6f8] text-[#111]"}`}>Answer</button>
              <button className={`h-7 border-l border-[#e8e8e8] ${isImproveView ? "bg-[#f5f6f8] text-[#111] font-medium" : "bg-white text-[#666]"}`}>Improve</button>
              <button className="h-7 border-l border-[#e8e8e8] bg-white text-[#666]">Save</button>
            </div>
          </div>

          {!isImproveView && (
          <div data-tour-id="word-plugin-bulk-answer" className="rounded-md border border-[#e4e4e4] p-2 mb-2">
            <div className="grid grid-cols-3 gap-1 mb-2">
              <button className="h-7 rounded border border-[#e5e5e5] text-[11px] text-[#444] inline-flex items-center justify-center gap-1">
                <MessageSquareText className="h-3.5 w-3.5" />
                Single
              </button>
              <button className={`h-7 rounded text-[11px] font-medium inline-flex items-center justify-center gap-1 ${
                isBulkView ? "bg-[#162042] text-white" : "border border-[#e5e5e5] text-[#444] bg-white"
              }`}>
                <Zap className="h-3.5 w-3.5" />
                Bulk
              </button>
              <button className="h-7 rounded border border-[#e5e5e5] text-[11px] text-[#444]">Update</button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#666] mb-2">
              <div className="inline-flex items-center gap-1 border border-[#ececec] rounded px-2 py-1">
                <FileText className="h-3.5 w-3.5" />
                <span>Document: All Documents</span>
              </div>
              <button className="inline-flex items-center gap-1 text-[#3d64b8]">
                <Plus className="h-3 w-3" /> Add Filter
              </button>
            </div>

            <div className="rounded-lg border border-[#e5e5e5] p-3 mt-2 bg-[#fafafa]">
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-full bg-[#eef0f7] inline-flex items-center justify-center mt-0.5">
                  <Zap className="h-3.5 w-3.5 text-[#162042]" />
                </div>
                <div>
                  <h4 className="text-[16px] font-semibold text-[#1f1f1f]">Bulk Answer Agent</h4>
                  <p className="text-[12px] leading-5 text-[#555] mt-1">
                    An AI agent will answer multiple highlighted questions in your document simultaneously.
                    Use the highlighter tool in Word to select questions, then run the bulk answer agent.
                  </p>
                </div>
              </div>
              <div className="h-px bg-[#e6e6e6] my-3" />
              <button className="h-11 px-6 rounded-md bg-[#162042] text-white text-[15px] font-semibold inline-flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Bulk Answer
              </button>
            </div>
          </div>
          )}

          {isImproveView && (
            <div data-tour-id="word-plugin-improve" className="rounded-md border border-[#e4e4e4] p-3 mb-2">
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button className="h-8 rounded-md bg-[#f0f2f6] text-[#4a4a4a] text-[12px] font-medium">Grammar</button>
                <button className="h-8 rounded-md text-[#666] text-[12px]">Longer</button>
                <button className="h-8 rounded-md text-[#666] text-[12px]">Shorter</button>
                <button className="h-8 rounded-md text-[#666] text-[12px]">Tone</button>
              </div>
              <p className="text-[12px] text-[#444] mb-2">Add instructions to improve (optional)</p>
              <textarea
                className="w-full h-20 rounded-md border border-[#e5e5e5] px-3 py-2 text-[12px] text-[#555] resize-none"
                placeholder="e.g., Make it more professional and engaging..."
              />
              <div className="flex justify-end mt-3">
                <button className="h-9 px-5 rounded-md bg-[#8c949f] text-white text-[14px] inline-flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  Improve
                </button>
              </div>
            </div>
          )}

          <div className="mt-auto pt-2 text-[11px] text-[#7a7a7a]">
            <div className="flex items-center justify-between mb-2">
              <span>Use "Answer With AI" to generate answers or "Search Vault" to search for content.</span>
              <div className="inline-flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                <Info className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="h-6 bg-white border-t border-[#e5e5e5] px-3 text-[11px] text-[#666] flex items-center justify-between">
        <span>Page 1 of 4 | 1411 words</span>
        <span>English (United States)</span>
      </footer>
    </div>
  );
}

