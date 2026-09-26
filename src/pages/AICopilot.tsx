import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  RefreshCw,
  Zap,
  Scale,
  Wallet,
  FileText,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { CopilotMessage } from "../types";
import { sendCopilotChat, fetchCopilotContext } from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";
import Markdown from "react-markdown";
import { PageInfoButton } from "../components/ui/PageInfoButton";
import { InfoTooltip } from "../components/ui/InfoTooltip";

interface AICopilotProps {
  onNavigate: (path: string) => void;
  initialQuery?: string;
}

/**
 * Sanitizes and normalizes markdown text to ensure:
 * 1. Zero emojis are displayed anywhere in the rendered output.
 * 2. Unrendered triple asterisks (***) or '* **' are converted into clean markdown bold and lists.
 * 3. Spaces inside bold markers like '** bold **' are fixed to '**bold**'.
 * 4. Raw LaTeX math syntax is replaced with clean plain-text labels.
 * 5. Lists have proper line breaks so CommonMark parses them as real HTML lists.
 */
function formatMarkdownContent(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Remove all Unicode emojis and pictographs
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu, "");

  // 2. Fix lines where asterisks bullet collide with bold, e.g. "* **" or "***" at line start -> "- **"
  text = text.replace(/^(\s*)\*\s*\*\*/gm, "$1- **");
  text = text.replace(/^(\s*)\*\*\*\s*/gm, "$1- **");

  // 3. Fix triple asterisks used as bold/emphasis: e.g. "***text***" -> "**text**"
  text = text.replace(/\*\*\*([^*]+?)\*\*\*/g, "**$1**");

  // 4. Fix spaces inside bold markers like "** bold **" -> "**bold**"
  text = text.replace(/\*\*\s+([^*]+?)\s+\*\*/g, "**$1**");

  // 5. Clean up any remaining stray triple asterisks like "***"
  text = text.replace(/\s*\*\*\*\s*/g, " ");

  // 6. Clean up raw LaTeX math expressions
  text = text.replace(/\\\$/g, "$");
  text = text.replace(/\$\\sum\s*\\text\{\s*DR\s*\}\$/g, "Total Debits");
  text = text.replace(/\$\\sum\s*\\text\{\s*CR\s*\}\$/g, "Total Credits");
  text = text.replace(/\$\\Delta\$/g, "Variance");
  text = text.replace(/\$\$\\sum\s*\\text\{Debits\}\s*=\s*\\sum\s*\\text\{Credits\}\$\$/g, "**Total Debits = Total Credits**");
  text = text.replace(/\$\$/g, "");

  // 7. Ensure lists have a preceding blank line so CommonMark parser reliably treats them as <ul>
  text = text.replace(/([^\n])\n(\s*-\s)/g, "$1\n\n$2");

  return text.trim();
}

export const AICopilot: React.FC<AICopilotProps> = ({ onNavigate, initialQuery }) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content: `### Welcome to LedgerAI Live Copilot

I am continuously connected to your active **SQLite General Ledger**. Every single minute financial change — newly added transactions, invoice approvals, statutory TDS deductions, journal entries, and bank balance fluctuations — is indexed in real time.

**Try asking me about real-time financial changes:**
- *"What changed recently in the ledger?"*
- *"What was the latest transaction added?"*
- *"Are debits and credits balanced right now?"*
- *"What is our liquid cash in HDFC and ICICI?"*
- *"Show all unpaid vendor invoices and due dates"*
- *"What is our TDS liability under Section 194C and 194J?"*
- *"What is our monthly burn rate and runway?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [liveContext, setLiveContext] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recentChangeDetected, setRecentChangeDetected] = useState(false);
  const prevTxCountRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  // Load real-time financial context
  const refreshContext = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsSyncing(true);
    try {
      const ctx = await fetchCopilotContext();
      if (prevTxCountRef.current !== null && ctx.tx_count !== prevTxCountRef.current) {
        setRecentChangeDetected(true);
      }
      prevTxCountRef.current = ctx.tx_count;
      setLiveContext(ctx);
    } catch (err) {
      console.warn("Failed to fetch live copilot context:", err);
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsSyncing(false), 400);
      }
    }
  }, []);

  // Polling every 8 seconds to detect minute financial changes
  useEffect(() => {
    refreshContext();
    const interval = setInterval(() => {
      refreshContext(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !autoSentRef.current) {
      autoSentRef.current = true;
      handleSendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);
    setRecentChangeDetected(false);

    try {
      const botResponse = await sendCopilotChat(query);
      setMessages((prev) => [...prev, botResponse]);
      refreshContext(false);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "I encountered an issue querying the ledger database. Please verify the server connection and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        role: "assistant",
        content: `### Session Cleared

Copilot memory has been reset and re-synchronized with the active database. Ask any question about your real-time financial ledger!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const samplePrompts = [
    { label: "Recent Changes", query: "What changed recently in the ledger?" },
    { label: "Liquid Cash", query: "What is our liquid cash balance in HDFC and ICICI?" },
    { label: "GL Invariant", query: "Are debits and credits balanced right now?" },
    { label: "Unpaid Bills", query: "Show all unpaid vendor invoices" },
    { label: "AWS Spend", query: "How much did we spend on AWS?" },
    { label: "TDS Liability", query: "What is our TDS withholding liability under 194C and 194J?" },
    { label: "Risk Flags", query: "Are there any anomalies or duplicate charges?" },
    { label: "Burn & Runway", query: "What is our monthly burn rate and runway?" },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-3 space-y-2.5 flex flex-col h-[calc(100vh-6.5rem)] select-none">
      {/* Real-time Financial Pulse Bar (Stats Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <button
          onClick={() => handleSendMessage("What is our liquid cash balance across accounts?")}
          className="p-2.5 rounded-lg bg-[#0c0d11] border border-[#22242b] hover:border-[#38bdf8]/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#71717a] font-medium">
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3 text-[#38bdf8]" />
              Liquid Treasury
              <InfoTooltip text="Live combined balance across all active HDFC Operating and ICICI Treasury bank accounts." title="Liquid Treasury" />
            </span>
            <ChevronRight className="w-3 h-3 text-[#71717a] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {liveContext ? formatCurrency(liveContext.liquid_cash) : <span className="text-xs text-[#71717a]">Loading...</span>}
          </div>
        </button>

        <button
          onClick={() => handleSendMessage("Are debits and credits balanced right now?")}
          className="p-2.5 rounded-lg bg-[#0c0d11] border border-[#22242b] hover:border-emerald-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#71717a] font-medium">
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-emerald-400" />
              GL Invariance
              <InfoTooltip text="Double-entry balance verification ensuring aggregate debits equal credits with zero variance." title="GL Invariance" formula="Total DR - Total CR = 0" />
            </span>
            <ChevronRight className="w-3 h-3 text-[#71717a] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
            <span>{liveContext ? (liveContext.is_gl_balanced ? "Delta = ₹0.00" : "Variance Alert") : "Verifying..."}</span>
            {liveContext && (
              <span className="text-[10px] text-[#71717a] font-normal">
                ({liveContext.is_gl_balanced ? "Balanced" : "Review"})
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => handleSendMessage("Show all unpaid vendor invoices and payables")}
          className="p-2.5 rounded-lg bg-[#0c0d11] border border-[#22242b] hover:border-amber-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#71717a] font-medium">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-amber-400" />
              Open Payables
              <InfoTooltip text="Total count and currency value of open vendor bills awaiting settlement." title="Accounts Payable" />
            </span>
            <ChevronRight className="w-3 h-3 text-[#71717a] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {liveContext ? (
              `${liveContext.unpaid_invoice_count} Bills (${formatCurrency(liveContext.unpaid_invoice_total)})`
            ) : (
              <span className="text-xs text-[#71717a]">Syncing...</span>
            )}
          </div>
        </button>

        <button
          onClick={() => handleSendMessage("What changed recently in the ledger?")}
          className="p-2.5 rounded-lg bg-[#0c0d11] border border-[#22242b] hover:border-blue-500/50 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#71717a] font-medium">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-400" />
              Live Feed
              <InfoTooltip text="Transactions ingested into the active database and grounded in Copilot context memory." title="Real-Time Data Feed" />
            </span>
            <ChevronRight className="w-3 h-3 text-[#71717a] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {liveContext ? `${liveContext.tx_count} Transactions` : <span className="text-xs text-[#71717a]">Syncing...</span>}
          </div>
        </button>
      </div>

      {/* Real-Time Database Change Alert Pill */}
      {recentChangeDetected && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
            <span>Database state updated: New transaction or journal entry recorded in real time.</span>
          </div>
          <button
            onClick={() => handleSendMessage("What was the latest transaction added?")}
            className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] cursor-pointer"
          >
            What changed?
          </button>
        </div>
      )}

      {/* Question Templates (Instant Prompts) with Direct Sync & Clear Actions */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
          <span className="text-xs font-medium text-[#71717a] shrink-0">
            Instant Prompts:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              className="px-2.5 py-1 rounded-full bg-[#0c0d11] border border-[#22242b] hover:border-[#3b82f6] hover:bg-[#14151c] text-[#d4d4d8] hover:text-white text-xs font-medium whitespace-nowrap transition-all shadow-xs cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-[#22242b]">
          <PageInfoButton guideKey="copilot" />
          <button
            id="btn-sync-copilot-context"
            onClick={() => refreshContext(true)}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] text-[#a1a1aa] hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Sync latest database state"
          >
            <RefreshCw className={cn("w-3 h-3 text-[#38bdf8]", isSyncing && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </button>
          <button
            id="btn-clear-copilot-chat"
            onClick={handleClearChat}
            className="flex items-center gap-1 p-1 rounded bg-[#0c0d11] hover:bg-rose-500/10 border border-[#22242b] hover:border-rose-500/30 text-[#71717a] hover:text-rose-400 text-xs font-medium transition-colors cursor-pointer"
            title="Clear chat history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={cn("flex gap-2.5 items-start", isUser ? "justify-end" : "justify-start")}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-[#0c0d11] border border-[#22242b] text-[#38bdf8] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-2xl lg:max-w-3xl xl:max-w-4xl rounded-lg p-3.5 text-xs leading-relaxed space-y-2",
                  isUser
                    ? "bg-[#2563eb] text-white shadow-xs"
                    : "bg-[#0c0d11] border border-[#22242b] text-white shadow-xs"
                )}
              >
                {/* Content text rendered via Markdown with explicit component styles */}
                <div className="text-xs leading-relaxed font-normal">
                  <Markdown
                    components={{
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white tracking-normal">{children}</strong>
                      ),
                      b: ({ children }) => (
                        <b className="font-semibold text-white tracking-normal">{children}</b>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-sm font-semibold text-white tracking-tight mt-3 mb-1.5 border-b border-[#22242b] pb-1">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xs font-semibold text-white tracking-tight mt-2.5 mb-1">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xs font-medium text-[#38bdf8] mt-2 mb-1">{children}</h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-xs font-medium text-white mt-1.5 mb-0.5">{children}</h4>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 leading-relaxed text-[#d4d4d8] last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1.5 my-2 text-[#d4d4d8]">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-1.5 my-2 text-[#d4d4d8]">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-xs leading-relaxed text-[#d4d4d8]">{children}</li>
                      ),
                      code: ({ children }) => (
                        <code className="bg-[#050507] px-1.5 py-0.5 rounded text-[#38bdf8] border border-[#22242b] font-mono text-[11px]">
                          {children}
                        </code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-[#38bdf8] pl-2.5 my-1.5 text-[#a1a1aa] italic">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="border-[#1e2029] my-2.5" />,
                    }}
                  >
                    {formatMarkdownContent(msg.content)}
                  </Markdown>
                </div>

                {/* Rich Data Cards (Metrics, charts, breakdown, transactions) */}
                {msg.data && (
                  <div className="mt-2.5 pt-2 border-t border-[#1e2029] space-y-2.5">
                    {/* Metrics Grid */}
                    {msg.data.metrics && msg.data.metrics.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {msg.data.metrics.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className={cn(
                              "p-2 rounded border text-xs",
                              m.highlight
                                ? "bg-blue-500/10 border-blue-500/30 text-white font-medium"
                                : "bg-[#050507] border-[#22242b] text-white"
                            )}
                          >
                            <span className="text-xs text-[#71717a] font-medium">{m.label}</span>
                            <div className="text-sm font-bold mt-0.5">{m.value}</div>
                            {m.change && (
                              <span className="text-[10px] text-[#38bdf8] font-medium">{m.change}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Grounded SQL Tag */}
                    {msg.data.sqlQuery && (
                      <div className="p-2 rounded bg-[#050507] border border-[#22242b] text-[#38bdf8] text-[10px] font-mono overflow-x-auto">
                        <span className="text-[#71717a] font-medium block mb-0.5 font-sans">
                          Grounding SQL Query Executed:
                        </span>
                        <code>{msg.data.sqlQuery}</code>
                      </div>
                    )}

                    {/* Drill-down Action Link */}
                    {msg.data.actionLink && (
                      <button
                        onClick={() => onNavigate(msg.data.actionLink!.path)}
                        className="w-full py-1.5 px-3 rounded bg-[#050507] hover:bg-[#14151c] border border-[#22242b] text-[#38bdf8] text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{msg.data.actionLink.label}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "text-[9px] text-right font-medium",
                    isUser ? "text-blue-200" : "text-[#71717a]"
                  )}
                >
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  MN
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-lg bg-[#0c0d11] border border-[#22242b] text-[#38bdf8] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#0c0d11] border border-[#22242b] rounded-lg px-3 py-2 text-xs flex items-center gap-2 text-[#71717a] shadow-xs">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce" />
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
              <span className="font-medium ml-1 text-xs text-white">Inspecting live ledger database & invariants...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="shrink-0 pt-1"
      >
        <div className="relative flex items-center bg-[#0c0d11] border border-[#22242b] rounded-lg shadow-xs p-1 focus-within:border-[#3b82f6] transition-all">
          <input
            id="input-copilot-chat"
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything down to minute financial changes (e.g. 'What changed recently?', 'HDFC balance', 'AWS spend')..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none"
          />
          <button
            id="btn-send-copilot"
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="px-3.5 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#22c55e] disabled:bg-[#14151c] disabled:text-[#71717a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/40 disabled:border-[#22242b]"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
