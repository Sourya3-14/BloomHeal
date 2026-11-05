import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { aiApi } from "../../utils/api";
import { Stethoscope, Building2, HeartPulse, BookOpen, Send, Sparkles, ArrowRight, ArrowUpRight, ShieldCheck, Users, Activity } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // AI Assistant state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (location.hash === "#ai-assistant") {
      const el = document.getElementById("ai-assistant");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  useEffect(() => {
    // Only auto-scroll if the chat actually contains messages
    if (chatMessages.length > 0 && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const sendMessage = async () => {
    const message = chatInput.trim();
    if (!message || isSending) return;
    setIsSending(true);
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatInput("");
    try {
      const { data } = await aiApi.post("/chat", { message });
      const reply = data?.reply || "";
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const features = [
    {
      icon: <Stethoscope className="w-6 h-6 text-[#2D7A5F]" />,
      title: "Expert Healthcare",
      desc: "Connect with qualified doctors and healthcare professionals in your area instantly.",
    },
    {
      icon: <Building2 className="w-6 h-6 text-[#2D7A5F]" />,
      title: "NGO Network",
      desc: "Access healthcare services and support from trusted non-governmental organizations.",
    },
    {
      icon: <HeartPulse className="w-6 h-6 text-[#2D7A5F]" />,
      title: "Community Health",
      desc: "Connect with local health workers for community-based healthcare and frontline assistance.",
    },
    {
      icon: <BookOpen className="w-6 h-6 text-[#2D7A5F]" />,
      title: "Health Education",
      desc: "Access informative blogs, wellness insights, and articles verified by medical experts.",
    },
  ];

  const stats = [
    {
      num: "1,000+",
      label: "Healthcare Experts",
      icon: <Stethoscope size={16} />,
    },
    { num: "50+", label: "Partnered NGOs", icon: <Building2 size={16} /> },
    { num: "100+", label: "Health Workers", icon: <Users size={16} /> },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F0F7F4] font-sans antialiased text-[#1A3C34] selection:bg-[#2D7A5F]/20 selection:text-[#1A3C34]">
      {/* ── 1. HERO SECTION ── */}
      <header className="relative overflow-hidden bg-gradient-to-b from-white via-[#F6FFFC] to-[#F0F7F4] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#4CAF82]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />

        <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="space-y-6 lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7A5F]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2D7A5F]">
              <Activity size={12} className="animate-pulse" />
              Unified Ecosystem
            </div>
            <h1 className="text-4xl font-extrabold sm:text-6xl tracking-tight leading-tight">
              Welcome to <span className="bg-gradient-to-r from-[#1A3C34] via-[#2D7A5F] to-[#4CAF82] bg-clip-text text-transparent">BloomHeal</span>
            </h1>
            <p className="text-base sm:text-lg text-[#4A7A6A] font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              A comprehensive healthcare ecosystem connecting patients, healthcare professionals, and community support networks for optimized medical outcomes.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate("/signup")}
                className="group flex items-center gap-2 rounded-xl bg-[#2D7A5F] px-6 py-3.5 font-bold text-white transition-all duration-200 hover:bg-[#245F4A] hover:shadow-lg hover:shadow-[#2D7A5F]/20 active:scale-[0.98]">
                Get Started
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/signin")}
                className="rounded-xl border-2 border-[#C8E6D8] bg-white px-6 py-3.5 font-bold text-[#2D7A5F] transition-all duration-200 hover:border-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-[0.98]">
                Sign In to Platform
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2D7A5F] to-[#4CAF82] rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-all duration-500 scale-95" />
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-br from-[#1A3C34] to-[#2D7A5F] rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 transition-transform duration-500 group-hover:scale-[1.02]">
                <Stethoscope className="w-24 h-24 text-white drop-shadow-lg animate-bounce [animation-duration:3s]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. FEATURES GRID SECTION ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 mx-auto max-w-[1200px]">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-black tracking-tight">Why Choose BloomHeal?</h2>
          <p className="text-sm sm:text-base text-[#4A7A6A] font-medium max-w-xl mx-auto">
            Breaking down communication siloes to deliver decentralized medicine and local emergency tracking infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm hover:shadow-xl hover:border-[#C8E6D8] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#F6FFFC] border border-[#C8E6D8] rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">{feat.icon}</div>
                <h3 className="text-lg font-bold text-[#1A3C34] group-hover:text-[#2D7A5F] transition-colors">{feat.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[#4A7A6A] font-medium">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. PREMIUM AI ASSISTANT SECTION ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 mx-auto max-w-[1200px]" id="ai-assistant">
        <div className="bg-white rounded-3xl border border-[#E8F5F0] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Info Side Panel */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#1A3C34] to-[#2D7A5F] p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#C8E6D8]">
                <Sparkles size={12} className="text-[#4CAF82]" />
                Neural Network Mode
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">AI Clinical Assistant</h2>
              <p className="text-xs sm:text-sm leading-relaxed text-white/80 font-medium">
                Ask initial wellness questions safely. Guest interactions are ephemeral, while account users gain absolute encrypted history syncs.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6 mt-8 lg:mt-0 space-y-3 text-xs text-[#C8E6D8] font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#4CAF82]" />
                HIPAA Compliant Handlers
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#4CAF82]" />
                Zero-Knowledge Processing
              </div>
            </div>
          </div>

          {/* Interactive Interface Panel */}
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 bg-[#F6FFFC]/50">
            {/* Chat Output Monitor */}
            <div className="flex-1 bg-white border border-[#E8F5F0] rounded-2xl p-4 flex flex-col h-[320px] shadow-inner overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <Sparkles className="w-8 h-8 text-[#2D7A5F]/40 animate-pulse" />
                    <p className="text-xs sm:text-sm font-bold text-[#4A7A6A]">Awaiting query parameter initialization...</p>
                    <p className="text-[11px] text-[#4A7A6A]/60 font-medium">Type something on the right side panel to trigger the model response.</p>
                  </div>
                ) : (
                  chatMessages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`text-xs sm:text-sm max-w-[85%] px-4 py-2.5 rounded-2xl font-medium shadow-sm leading-relaxed ${
                          m.role === "user" ? "bg-gradient-to-br from-[#2D7A5F] to-[#4CAF82] text-white rounded-br-none" : "bg-[#F0F7F4] text-[#1A3C34] border border-[#E8F5F0] rounded-bl-none"
                        }`}>
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Stack */}
            <div className="sm:w-64 flex flex-col gap-3 justify-between">
              <div className="flex-1 flex flex-col">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#4A7A6A] mb-1.5 block">Input Stream</label>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe context details..."
                  className="w-full flex-1 min-h-[120px] sm:min-h-0 p-3 text-sm font-medium rounded-xl border border-[#C8E6D8] bg-white text-[#1A3C34] placeholder-[#4A7A6A]/40 focus:outline-none focus:ring-2 focus:ring-[#2D7A5F] focus:border-transparent resize-none transition-all"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={isSending || !chatInput.trim()}
                className="w-full group flex items-center justify-center gap-2 rounded-xl bg-[#2D7A5F] py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#245F4A] disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-[#2D7A5F]/10 active:scale-95">
                {isSending ? "Processing..." : "Ask Assistant"}
                <Send size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. ABOUT SECTION ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 mx-auto max-w-[1200px]">
        <div className="bg-white rounded-3xl border border-[#E8F5F0] p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">About BloomHeal</h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#4A7A6A] font-medium">
              BloomHeal is an architectural health network framework designed explicitly to link active practitioners directly to community patient nodes. We reduce systemic routing overhead so
              immediate local responses take precedence during regional operational stresses.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#4A7A6A] font-medium">
              Whether searching for authorized emergency mobile care vectors, verifying non-profit organizational camp maps, or executing standard symptom modeling profiles, BloomHeal ensures complete
              operational parity.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            {stats.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-[#F0F7F4]/50 border border-[#E8F5F0] p-4 rounded-2xl">
                <div className="w-10 h-10 bg-white border border-[#C8E6D8] rounded-xl flex items-center justify-center text-[#2D7A5F] shadow-sm">{item.icon}</div>
                <div>
                  <div className="text-xl font-black text-[#1A3C34] tracking-tight">{item.num}</div>
                  <div className="text-xs font-bold text-[#4A7A6A]">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA BOTTOM BUCKET ── */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1A3C34] to-[#2D7A5F] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#4CAF82_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-black tracking-tight">Ready to Get Started?</h2>
            <p className="text-sm text-white/80 font-medium max-w-md mx-auto leading-relaxed">Provision your encrypted health tracking account keys inside our main decentralized hub today.</p>
            <button
              onClick={() => navigate("/signup")}
              className="mx-auto rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#1A3C34] transition-all duration-200 hover:bg-[#F0F7F4] hover:shadow-lg active:scale-[0.98]">
              Create Your Secure Account
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. ARCHITECTURAL FOOTER ── */}
      <footer className="border-t border-[#C8E6D8]/40 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px] flex flex-col md:flex-row items-start justify-between gap-8 text-sm font-medium">
          <div className="space-y-3 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2D7A5F] rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-[#1A3C34] to-[#2D7A5F] bg-clip-text text-transparent">BloomHeal</span>
            </div>
            <p className="text-xs text-[#4A7A6A]">Decentralized healthcare connection software routing local services with zero processing friction.</p>
          </div>

          <div className="flex flex-wrap gap-12 sm:gap-24">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1A3C34]">Platform</h4>
              <ul className="space-y-2 text-xs text-[#4A7A6A]">
                <li>
                  <button onClick={() => navigate("/doctors")} className="hover:text-[#2D7A5F] transition-colors">
                    Find Doctors
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/ngos")} className="hover:text-[#2D7A5F] transition-colors">
                    NGO Directory
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/healthworkers")} className="hover:text-[#2D7A5F] transition-colors">
                    Health Workers
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/blogs")} className="hover:text-[#2D7A5F] transition-colors">
                    Health Blogs
                  </button>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1A3C34]">Gateway</h4>
              <ul className="space-y-2 text-xs text-[#4A7A6A]">
                <li>
                  <button onClick={() => navigate("/signup")} className="hover:text-[#2D7A5F] transition-colors">
                    Sign Up Keys
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/signin")} className="hover:text-[#2D7A5F] transition-colors">
                    Sign In Workspace
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] border-t border-[#F0F7F4] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#4A7A6A]/60 font-bold tracking-wide">
          <p>&copy; 2026 BloomHeal Core Systems. All rights secured.</p>
          <p className="uppercase">Operational Node status: Online</p>
        </div>
      </footer>
    </div>
  );
}
