import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { aiApi } from "../../utils/api";
import Navbar from "../../components/Navbar";
import {
  Bot,
  User,
  Send,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    try {
      const res = await aiApi.post("/chat", { message: text });
      const reply = res.data?.reply || "";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Secure endpoint communication failure.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleCopyCode = (codeText, blockId) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(blockId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // BloomHeal custom markdown system components mapped dynamically via Tailwind
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const codeString = String(children).replace(/\n$/, "");
      const blockId = codeString.slice(0, 15) + children.length;

      if (!inline && language) {
        return (
          <div className="my-4 overflow-hidden rounded-xl border border-[#C8E6D8] bg-[#1E293B] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#2D7A5F]/20 bg-[#111827] px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4CAF82]">
                {language}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800/50 px-2 py-1 text-[11px] font-bold text-gray-400 transition-all hover:bg-gray-800 hover:text-white"
                onClick={() => handleCopyCode(codeString, blockId)}
              >
                {copiedId === blockId ? (
                  <>
                    <Check size={12} className="text-[#4CAF82]" />
                    <span className="text-[#4CAF82]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <SyntaxHighlighter
              style={tomorrow}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                background: "transparent",
                padding: "1rem",
                fontSize: "0.825rem",
                fontFamily: "var(--font-mono, monospace)",
              }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code
          className="rounded bg-[#2D7A5F]/10 px-1.5 py-0.5 font-mono text-xs font-bold text-[#1A3C34]"
          {...props}
        >
          {children}
        </code>
      );
    },

    blockquote({ children }) {
      return (
        <blockquote className="my-4 border-l-4 border-[#2D7A5F] bg-[#F6FFFC] p-4 rounded-r-xl text-xs sm:text-sm font-medium italic text-[#4A7A6A] leading-relaxed shadow-sm">
          {children}
        </blockquote>
      );
    },

    table({ children }) {
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-[#E8F5F0] shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            {children}
          </table>
        </div>
      );
    },

    thead({ children }) {
      return (
        <thead className="bg-[#F6FFFC] border-b border-[#E8F5F0]">
          {children}
        </thead>
      );
    },

    th({ children }) {
      return (
        <th className="px-4 py-2.5 font-black uppercase tracking-wider text-[#1A3C34]">
          {children}
        </th>
      );
    },

    td({ children }) {
      return (
        <td className="px-4 py-3 border-t border-[#F0F7F4] font-medium text-[#4A7A6A]">
          {children}
        </td>
      );
    },

    ul({ children }) {
      return (
        <ul className="my-3 list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1A3C34] font-medium">
          {children}
        </ul>
      );
    },

    ol({ children }) {
      return (
        <ol className="my-3 list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-[#1A3C34] font-medium">
          {children}
        </ol>
      );
    },

    li({ children }) {
      return (
        <li className="leading-relaxed marker:text-[#2D7A5F]">{children}</li>
      );
    },

    h1({ children }) {
      return (
        <h1 className="text-xl font-black tracking-tight text-[#1A3C34] mt-6 mb-2 border-b border-[#F0F7F4] pb-1">
          {children}
        </h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="text-lg font-black tracking-tight text-[#1A3C34] mt-5 mb-2">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return (
        <h3 className="text-base font-black text-[#1A3C34] mt-4 mb-1.5">
          {children}
        </h3>
      );
    },
    h4({ children }) {
      return (
        <h4 className="text-sm font-black text-[#1A3C34] mt-3 mb-1">
          {children}
        </h4>
      );
    },

    p({ children }) {
      return (
        <p className="text-xs sm:text-sm font-medium text-[#1A3C34] leading-relaxed mb-3 last:mb-0">
          {children}
        </p>
      );
    },

    a({ href, children }) {
      return (
        <a
          href={href}
          className="text-[#2D7A5F] font-bold underline transition-colors hover:text-[#245F4A]"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },

    strong({ children }) {
      return (
        <strong className="font-extrabold text-[#1A3C34]">{children}</strong>
      );
    },

    em({ children }) {
      return <em className="italic text-[#4A7A6A]">{children}</em>;
    },
  };

  const renderMessageContent = (message) => {
    if (message.role === "user") {
      return (
        <p className="text-xs sm:text-sm font-bold text-white whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
      );
    } else {
      return (
        <div className="prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased selection:bg-[#2D7A5F]/20 selection:text-[#1A3C34]">
      <Navbar />

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Module Header Card */}
        <div className="relative overflow-hidden bg-white rounded-3xl border border-[#E8F5F0] p-6 md:p-8 shadow-sm mb-6">
          <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7A5F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2D7A5F]">
              <Sparkles size={12} />
              AI Core Interface
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#1A3C34] sm:text-3xl">
              AI Health Assistant
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#4A7A6A] max-w-xl">
              Query clinical information structures, synthesize localized
              medical documentation definitions, or review health record
              insights.
            </p>
          </div>
        </div>

        {/* Core Chat Sandbox */}
        <div className="bg-white rounded-2xl border border-[#E8F5F0] shadow-sm h-[68vh] flex flex-col overflow-hidden">
          {/* Scrollable Chat Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto space-y-4 animate-fadeIn">
                <div className="w-12 h-12 bg-[#F6FFFC] border border-[#C8E6D8] rounded-2xl flex items-center justify-center text-[#2D7A5F] shadow-sm">
                  <Bot size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1A3C34]">
                    Secure Session Node Active
                  </h4>
                  <p className="text-xs font-medium text-[#4A7A6A] leading-relaxed">
                    Start a conversation. If signed into your identity contract,
                    metadata summaries sync securely over time. Otherwise,
                    temporary tracking parameters apply via session cookies.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 md:gap-4 max-w-[85%] animate-fadeIn ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Persona Indicator Tokens */}
                  <div
                    className={`w-8 h-8 rounded-xl border flex-shrink-0 flex items-center justify-center shadow-sm ${
                      isUser
                        ? "bg-[#2D7A5F] border-[#2D7A5F] text-white"
                        : "bg-[#F6FFFC] border-[#C8E6D8] text-[#2D7A5F]"
                    }`}
                  >
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  {/* Messaging Clusters */}
                  <div
                    className={`p-4 rounded-2xl border shadow-xs leading-relaxed ${
                      isUser
                        ? "bg-[#2D7A5F] border-[#2D7A5F] rounded-tr-none text-white shadow-[#2D7A5F]/5"
                        : "bg-[#FDFEFF] border-[#E8F5F0] rounded-tl-none text-[#1A3C34]"
                    }`}
                  >
                    {renderMessageContent(m)}
                  </div>
                </div>
              );
            })}

            {/* Asynchronous Processing Thread State */}
            {loading && (
              <div className="flex gap-3 md:gap-4 max-w-[85%] mr-auto items-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl border bg-[#F6FFFC] border-[#C8E6D8] text-[#2D7A5F] flex-shrink-0 flex items-center justify-center shadow-sm">
                  <Loader2 size={14} className="animate-spin" />
                </div>
                <div className="bg-[#FDFEFF] border border-[#E8F5F0] rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center gap-3">
                  <span className="text-xs font-bold text-[#4A7A6A]">
                    Assistant compiling nodes
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#2D7A5F] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#2D7A5F] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#2D7A5F] rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Prompt Entry Controls */}
          <div className="border-t border-[#F0F7F4] bg-[#FDFEFF] p-4">
            <form
              onSubmit={sendMessage}
              className="relative flex items-center gap-2"
            >
              <input
                type="text"
                className="w-full rounded-xl border border-[#C8E6D8] bg-white pl-4 pr-12 py-3 text-xs sm:text-sm font-semibold text-[#1A3C34] placeholder:text-[#4A7A6A]/40 transition-all focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5 disabled:opacity-60"
                placeholder="Ask a health question or decode parameters…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="absolute right-2 p-2 rounded-lg bg-[#2D7A5F] text-white hover:bg-[#245F4A] transition-all active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                disabled={loading || !input.trim()}
                title="Send Prompt Token"
              >
                <Send size={14} />
              </button>
            </form>

            {/* Error Mitigation Display Systems */}
            {error && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 p-3 text-red-800 animate-fadeIn">
                <AlertCircle
                  size={14}
                  className="flex-shrink-0 mt-0.5 text-red-600"
                />
                <div className="text-[11px] font-bold">{error}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChatPage;
