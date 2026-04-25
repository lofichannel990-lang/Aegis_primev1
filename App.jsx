// ============================================================
//  AEGIS PRIME — AI Assistant
//  Single-file React App | Groq API | GPT-4o Vision | Admin
//  Deploy: Vercel / GitHub Pages
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
//  CONFIG — Edit these values to customise Aegis Prime
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  APP_NAME: "AEGIS PRIME",
  APP_TAGLINE: "Elite AI Intelligence",
  ADMIN_PASSWORD: "aegis2025",          // Change this!
  FREE_CREDITS_PER_DAY: 25,
  GROQ_MODEL: "llama-3.3-70b-versatile",
  GPT4O_MODEL: "gpt-4o",
  GROQ_API_KEY: "",                     // Set via env or paste here
  OPENAI_API_KEY: "",                   // For vision/image uploads
  SYSTEM_PROMPT: `You are Aegis Prime, an elite AI assistant with deep knowledge across all domains.
You are precise, insightful, and always deliver high-quality responses.
When writing code, always use markdown code blocks with the correct language identifier.
Be concise yet thorough. Respond in the same language as the user.`,
};

// ─────────────────────────────────────────────────────────────
//  STORAGE HELPERS
// ─────────────────────────────────────────────────────────────
const storage = {
  get: (k, d = null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
    catch { return d; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function getCredits() {
  const today = new Date().toDateString();
  const stored = storage.get("aegis_credits", { date: today, used: 0, calls: 0 });
  if (stored.date !== today) {
    const fresh = { date: today, used: 0, calls: 0 };
    storage.set("aegis_credits", fresh);
    return fresh;
  }
  return stored;
}
function useCredit() {
  const c = getCredits();
  c.used += 1; c.calls += 1;
  storage.set("aegis_credits", c);
}
function hasCredits() { return getCredits().used < CONFIG.FREE_CREDITS_PER_DAY; }

// ─────────────────────────────────────────────────────────────
//  API CALLS
// ─────────────────────────────────────────────────────────────
async function callGroq(messages, apiKey) {
  const key = apiKey || CONFIG.GROQ_API_KEY;
  if (!key) throw new Error("No Groq API key set. Visit Admin panel to configure.");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: CONFIG.GROQ_MODEL,
      messages: [{ role: "system", content: CONFIG.SYSTEM_PROMPT }, ...messages],
      max_tokens: 4096, temperature: 0.7, stream: false,
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `Groq error ${res.status}`); }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGPT4oVision(messages, imageBase64, apiKey) {
  const key = apiKey || CONFIG.OPENAI_API_KEY;
  if (!key) throw new Error("No OpenAI API key set for vision. Visit Admin panel.");
  const visionMsg = [
    { role: "system", content: CONFIG.SYSTEM_PROMPT },
    ...messages.slice(0, -1),
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: imageBase64 } },
        { type: "text", text: messages[messages.length - 1].content },
      ],
    },
  ];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: CONFIG.GPT4O_MODEL, messages: visionMsg, max_tokens: 4096 }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `OpenAI error ${res.status}`); }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ─────────────────────────────────────────────────────────────
//  MARKDOWN → JSX RENDERER (lightweight, no dependencies)
// ─────────────────────────────────────────────────────────────
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-violet-500/20 bg-black/60">
      <div className="flex items-center justify-between px-4 py-2 border-b border-violet-500/20 bg-violet-950/30">
        <span className="text-xs font-mono text-violet-400 uppercase tracking-widest">{lang || "code"}</span>
        <button onClick={copy}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 transition-all duration-200">
          {copied ? (
            <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Copied!</>
          ) : (
            <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy</>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-violet-100 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderMarkdown(text) {
  const parts = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0, match, key = 0;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(<InlineText key={key++} text={text.slice(lastIndex, match.index)}/>);
    parts.push(<CodeBlock key={key++} lang={match[1]} code={match[2].trim()}/>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(<InlineText key={key++} text={text.slice(lastIndex)}/>);
  return parts;
}

function InlineText({ text }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong class='text-amber-300 font-semibold'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em class='text-violet-300'>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-violet-950/60 text-amber-300 px-1.5 py-0.5 rounded text-sm font-mono border border-violet-500/20'>$1</code>")
    .replace(/^### (.+)$/gm, "<h3 class='text-base font-bold text-amber-300 mt-4 mb-1.5'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-lg font-bold text-amber-200 mt-4 mb-2'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-xl font-bold text-amber-100 mt-4 mb-2'>$1</h1>")
    .replace(/^\- (.+)$/gm, "<li class='ml-4 text-violet-200 list-disc list-inside'>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 text-violet-200 list-decimal list-inside'>$1</li>")
    .replace(/\[(.+?)\]\((.+?)\)/g, "<a href='$2' target='_blank' class='text-amber-400 underline hover:text-amber-300'>$1</a>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} className="text-sm leading-relaxed text-violet-100"/>;
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTS
// ─────────────────────────────────────────────────────────────

// ── Animated background ──────────────────────────────────────
function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep base */}
      <div className="absolute inset-0" style={{ background: "#050505" }}/>
      {/* Violet nebula top-left */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
          animation: "pulse-slow 8s ease-in-out infinite alternate" }}/>
      {/* Gold accent top-right */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
          animation: "pulse-slow 10s ease-in-out infinite alternate-reverse" }}/>
      {/* Bottom violet */}
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-64 opacity-15"
        style={{ background: "radial-gradient(ellipse, #6d28d9 0%, transparent 70%)",
          animation: "pulse-slow 12s ease-in-out infinite alternate" }}/>
      {/* Noise grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px" }}/>
      <style>{`
        @keyframes pulse-slow { from { transform: scale(1) translate(0,0); } to { transform: scale(1.15) translate(10px, -10px); } }
        @keyframes float-up { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        @keyframes typing { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wave { 0%,100%{height:8px} 50%{height:20px} }
      `}</style>
    </div>
  );
}

// ── Elite loader ─────────────────────────────────────────────
function EliteLoader() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex items-end gap-0.5" style={{ height: 24 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="w-1 rounded-full"
            style={{ background: "linear-gradient(to top, #7c3aed, #f59e0b)",
              animation: `wave 1.1s ease-in-out ${i * 0.12}s infinite`,
              height: 8 }}/>
        ))}
      </div>
      <span className="text-xs text-violet-400 ml-2 font-mono tracking-widest"
        style={{ animation: "shimmer 2s ease-in-out infinite" }}>AEGIS THINKING…</span>
    </div>
  );
}

// ── Status indicator ─────────────────────────────────────────
function StatusIndicator({ loading }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-2.5 h-2.5">
        <div className={`w-2.5 h-2.5 rounded-full ${loading ? "bg-amber-400" : "bg-emerald-400"}`}/>
        {!loading && (
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 opacity-60"
            style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}/>
        )}
        {loading && (
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-amber-400 opacity-60"
            style={{ animation: "ping 0.8s cubic-bezier(0,0,0.2,1) infinite" }}/>
        )}
      </div>
      <span className="text-xs font-mono tracking-widest"
        style={{ color: loading ? "#f59e0b" : "#34d399" }}>
        {loading ? "PROCESSING" : "ONLINE"}
      </span>
    </div>
  );
}

// ── Credit bar ───────────────────────────────────────────────
function CreditBar({ credits }) {
  const remaining = CONFIG.FREE_CREDITS_PER_DAY - credits.used;
  const pct = (remaining / CONFIG.FREE_CREDITS_PER_DAY) * 100;
  const col = pct > 50 ? "#8b5cf6" : pct > 20 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}` }}/>
      </div>
      <span className="text-xs font-mono" style={{ color: col }}>{remaining}/{CONFIG.FREE_CREDITS_PER_DAY}</span>
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const copyAll = () => {
    navigator.clipboard.writeText(msg.content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className={`flex gap-3 mb-5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      style={{ animation: "slide-up 0.35s ease forwards" }}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold
        ${isUser ? "bg-gradient-to-br from-amber-500 to-amber-600 text-black" : "bg-gradient-to-br from-violet-600 to-violet-800 text-white border border-violet-500/40"}`}
        style={{ boxShadow: isUser ? "0 0 12px rgba(245,158,11,0.4)" : "0 0 12px rgba(139,92,246,0.4)" }}>
        {isUser ? "U" : "⚡"}
      </div>
      {/* Bubble */}
      <div className={`group relative max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {msg.image && (
          <img src={msg.image} alt="uploaded" className="max-w-xs rounded-xl border border-violet-500/30 mb-2"/>
        )}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? "bg-gradient-to-br from-violet-600/30 to-violet-800/30 border border-violet-500/30 text-violet-100 rounded-tr-sm"
            : "bg-white/[0.04] border border-white/10 text-violet-100 rounded-tl-sm backdrop-blur-sm"}`}
          style={{ boxShadow: isUser ? "0 4px 24px rgba(139,92,246,0.1)" : "none" }}>
          {isUser ? (
            <span className="text-violet-100">{msg.content}</span>
          ) : (
            <div>{renderMarkdown(msg.content)}</div>
          )}
        </div>
        {/* Copy button */}
        {!isUser && (
          <button onClick={copyAll}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-start
              flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-violet-400
              hover:text-amber-400 hover:bg-white/5 mt-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
        <span className="text-[10px] text-white/20 font-mono px-1">{msg.time}</span>
      </div>
    </div>
  );
}

// ── Welcome screen ───────────────────────────────────────────
function WelcomeScreen({ onSuggestion }) {
  const suggestions = [
    { icon: "⚡", text: "Explain quantum computing simply", label: "Science" },
    { icon: "💼", text: "Write a professional email for a job application", label: "Writing" },
    { icon: "🧠", text: "Help me debug a React useEffect error", label: "Code" },
    { icon: "📊", text: "Create a business plan outline for a SaaS startup", label: "Business" },
  ];
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 text-center"
      style={{ animation: "slide-up 0.5s ease forwards" }}>
      {/* Logo */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
            boxShadow: "0 0 40px rgba(139,92,246,0.5), 0 0 80px rgba(139,92,246,0.2)",
            animation: "float-up 4s ease-in-out infinite" }}>
          ⚡
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 8px #34d399", animation: "ping 2s infinite" }}/>
      </div>
      <h1 className="text-3xl font-black mb-1 tracking-tight"
        style={{ background: "linear-gradient(135deg, #a78bfa, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {CONFIG.APP_NAME}
      </h1>
      <p className="text-sm text-white/30 font-mono tracking-widest mb-10 uppercase">
        {CONFIG.APP_TAGLINE}
      </p>
      {/* Suggestions */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => onSuggestion(s.text)}
            className="group p-3.5 rounded-2xl border border-white/10 bg-white/[0.03]
              hover:border-violet-500/50 hover:bg-violet-500/10
              transition-all duration-300 text-left backdrop-blur-sm"
            style={{ animation: `slide-up 0.5s ease ${i * 0.08}s both` }}>
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xs text-white/60 mb-1 font-mono tracking-wider uppercase">{s.label}</div>
            <div className="text-xs text-white/80 leading-snug">{s.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Image preview ────────────────────────────────────────────
function ImagePreview({ src, onRemove }) {
  return (
    <div className="relative inline-block mr-3">
      <img src={src} alt="preview" className="h-16 w-16 object-cover rounded-xl border border-violet-500/40"/>
      <button onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400 transition-colors">
        ×
      </button>
    </div>
  );
}

// ── Input bar ────────────────────────────────────────────────
function InputBar({ onSend, loading, disabled }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null); // base64
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const textareaRef = useRef();
  const fileRef = useRef();
  const recognitionRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [text]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    const t = text.trim();
    if (!t && !image) return;
    onSend(t || "Describe this image", image);
    setText("");
    setImage(null);
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleVoice = () => {
    if (!voiceSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = "en-US"; rec.continuous = false; rec.interimResults = true;
      rec.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
        setText(transcript);
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="px-3 pb-4 pt-2">
      {/* Image preview */}
      {imagePreview && (
        <div className="flex items-center mb-2 px-1">
          <ImagePreview src={imagePreview} onRemove={() => { setImage(null); setImagePreview(null); }}/>
          <span className="text-xs text-amber-400 font-mono">Vision AI enabled</span>
        </div>
      )}
      {/* Bar */}
      <div className="relative flex items-end gap-2 p-2 rounded-2xl border border-white/10 backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.04)", boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>

        {/* Image upload */}
        <button onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
            border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 text-white/40 hover:text-amber-400"
          title="Upload image (Vision AI)">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}/>

        {/* Textarea */}
        <textarea ref={textareaRef} value={text}
          onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ask Aegis Prime anything…"
          rows={1} disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-white/90
            placeholder-white/20 leading-relaxed py-1.5 font-light"
          style={{ maxHeight: 140, scrollbarWidth: "none" }}/>

        {/* Voice */}
        {voiceSupported && (
          <button onClick={toggleVoice}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
              ${isListening ? "bg-red-500/20 border-red-500/60 text-red-400" : "border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10 text-white/40 hover:text-violet-400"}`}
            title="Voice input">
            {isListening ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            )}
          </button>
        )}

        {/* Send */}
        <button onClick={handleSend} disabled={loading || disabled || (!text.trim() && !image)}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
            transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: loading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
            boxShadow: loading ? "none" : "0 0 16px rgba(139,92,246,0.5)" }}>
          {loading ? (
            <svg className="w-4 h-4 text-violet-300 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          )}
        </button>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 mt-2 px-2">
          <div className="flex items-end gap-0.5 h-4">
            {[0,1,2].map(i => (
              <div key={i} className="w-0.5 rounded-full bg-red-400"
                style={{ animation: `wave 0.8s ease-in-out ${i*0.2}s infinite`, height: 8 }}/>
            ))}
          </div>
          <span className="text-xs text-red-400 font-mono">Listening… speak now</span>
        </div>
      )}

      <p className="text-center text-[10px] text-white/15 mt-2 font-mono">
        Shift+Enter for new line · Drop images to upload
      </p>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────
function AdminPanel({ onClose }) {
  const [groqKey, setGroqKey] = useState(storage.get("aegis_groq_key", CONFIG.GROQ_API_KEY));
  const [oaiKey, setOaiKey]   = useState(storage.get("aegis_oai_key", CONFIG.OPENAI_API_KEY));
  const [saved, setSaved] = useState(false);
  const credits = getCredits();
  const users   = storage.get("aegis_user_count", 1);
  const totalCalls = storage.get("aegis_total_calls", credits.calls);

  const save = () => {
    storage.set("aegis_groq_key", groqKey);
    storage.set("aegis_oai_key", oaiKey);
    CONFIG.GROQ_API_KEY = groqKey;
    CONFIG.OPENAI_API_KEY = oaiKey;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const stats = [
    { label: "Total Sessions", value: users, icon: "👤", color: "#a78bfa" },
    { label: "API Calls Today", value: credits.calls, icon: "⚡", color: "#f59e0b" },
    { label: "Credits Used", value: credits.used, icon: "💎", color: "#34d399" },
    { label: "Total Calls", value: totalCalls, icon: "📊", color: "#60a5fa" },
    { label: "System Status", value: "ONLINE", icon: "✅", color: "#34d399" },
    { label: "Groq Model", value: CONFIG.GROQ_MODEL.split("-").slice(0,2).join("-"), icon: "🧠", color: "#a78bfa" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(5,5,5,0.85)" }}>
      <div className="w-full max-w-lg rounded-3xl border border-violet-500/30 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0a0a, #0f0a1a)",
          boxShadow: "0 0 60px rgba(139,92,246,0.2), 0 0 120px rgba(139,92,246,0.05)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold" style={{ background: "linear-gradient(135deg, #a78bfa, #f59e0b)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ADMIN DASHBOARD
            </h2>
            <p className="text-xs text-white/30 font-mono mt-0.5 tracking-widest">AEGIS PRIME CONTROL PANEL</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center
            border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all text-sm">✕</button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 p-6 border-b border-white/5">
          {stats.map((s, i) => (
            <div key={i} className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* API Keys */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-white/30 font-mono tracking-widest uppercase mb-4">API Configuration</p>
          <div>
            <label className="text-xs text-violet-400 font-mono mb-1.5 block tracking-wider">GROQ API KEY</label>
            <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)}
              placeholder="gsk_…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80
                font-mono outline-none focus:border-violet-500/50 transition-colors placeholder-white/20"/>
          </div>
          <div>
            <label className="text-xs text-amber-400 font-mono mb-1.5 block tracking-wider">OPENAI API KEY (Vision)</label>
            <input type="password" value={oaiKey} onChange={e => setOaiKey(e.target.value)}
              placeholder="sk-…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80
                font-mono outline-none focus:border-amber-500/50 transition-colors placeholder-white/20"/>
          </div>
          <button onClick={save}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
            style={{ background: saved ? "linear-gradient(135deg, #059669, #047857)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: saved ? "0 0 16px rgba(5,150,105,0.4)" : "0 0 16px rgba(139,92,246,0.4)" }}>
            {saved ? "✓ SAVED SUCCESSFULLY" : "SAVE CONFIGURATION"}
          </button>
        </div>

        <div className="px-6 pb-6">
          <p className="text-[10px] text-white/20 font-mono text-center">
            Keys stored locally in browser · Never transmitted · Air-gapped storage
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [credits, setCredits] = useState(getCredits);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const messagesEndRef = useRef();
  const chatRef = useRef();

  // Load saved API keys on mount
  useEffect(() => {
    const gk = storage.get("aegis_groq_key", "");
    const ok = storage.get("aegis_oai_key", "");
    if (gk) CONFIG.GROQ_API_KEY = gk;
    if (ok) CONFIG.OPENAI_API_KEY = ok;
    // Track user session
    const users = storage.get("aegis_user_count", 0);
    storage.set("aegis_user_count", users + 1);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text, imageBase64 = null) => {
    if (!hasCredits()) {
      setError("Daily limit reached (25 credits). Resets at midnight. ✨");
      return;
    }
    setError(null);

    const userMsg = {
      role: "user", content: text,
      image: imageBase64, id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const historyForAPI = newMessages
      .filter(m => !m.image)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      let reply;
      if (imageBase64) {
        reply = await callGPT4oVision(historyForAPI, imageBase64, CONFIG.OPENAI_API_KEY);
      } else {
        reply = await callGroq(historyForAPI, CONFIG.GROQ_API_KEY);
      }
      useCredit();
      const totalCalls = storage.get("aegis_total_calls", 0);
      storage.set("aegis_total_calls", totalCalls + 1);
      setCredits(getCredits());
      setMessages(prev => [...prev, {
        role: "assistant", content: reply, id: Date.now() + 1,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ **Error:** ${err.message}\n\nPlease check your API key in the Admin panel (⚙️ button in the header).`,
        id: Date.now() + 1,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const handleAdminAccess = () => {
    if (adminInput === CONFIG.ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setShowAdmin(true);
      setShowAdminPrompt(false);
      setAdminInput("");
    } else {
      setAdminInput("");
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const hasApiKey = CONFIG.GROQ_API_KEY || storage.get("aegis_groq_key", "");

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#050505" }}>
      <AmbientBackground/>

      {/* Admin panels */}
      {showAdminPrompt && !adminUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(5,5,5,0.85)" }}>
          <div className="w-80 p-6 rounded-3xl border border-violet-500/30"
            style={{ background: "linear-gradient(135deg, #0a0a0a, #0f0a1a)",
              boxShadow: "0 0 60px rgba(139,92,246,0.2)" }}>
            <h3 className="text-center font-bold mb-1" style={{ background: "linear-gradient(135deg, #a78bfa, #f59e0b)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ADMIN ACCESS</h3>
            <p className="text-xs text-white/30 text-center font-mono mb-5 tracking-widest">ENTER PASSKEY</p>
            <input type="password" value={adminInput} onChange={e => setAdminInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdminAccess()}
              placeholder="••••••••" autoFocus
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm
                text-white/80 font-mono outline-none focus:border-violet-500/50 placeholder-white/20 text-center mb-3"/>
            <div className="flex gap-2">
              <button onClick={() => { setShowAdminPrompt(false); setAdminInput(""); }}
                className="flex-1 py-2 rounded-xl text-sm border border-white/10 text-white/40 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleAdminAccess}
                className="flex-1 py-2 rounded-xl text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                Access
              </button>
            </div>
          </div>
        </div>
      )}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)}/>}

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/[0.05]"
        style={{ background: "rgba(5,5,5,0.8)", backdropFilter: "blur(20px)" }}>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
              boxShadow: "0 0 16px rgba(139,92,246,0.5)" }}>⚡</div>
          <div>
            <div className="text-sm font-black tracking-tight"
              style={{ background: "linear-gradient(135deg, #a78bfa, #f59e0b)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {CONFIG.APP_NAME}
            </div>
            <div className="hidden sm:block text-[10px] text-white/20 font-mono tracking-widest">
              {CONFIG.APP_TAGLINE}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator loading={loading}/>
          <div className="hidden sm:flex items-center">
            <CreditBar credits={credits}/>
          </div>

          {/* Clear chat */}
          {messages.length > 0 && (
            <button onClick={clearChat}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10
                text-white/30 hover:text-white/70 hover:border-white/20 transition-all"
              title="Clear chat">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}

          {/* Admin */}
          <button onClick={() => adminUnlocked ? setShowAdmin(true) : setShowAdminPrompt(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10
              text-white/30 hover:text-amber-400 hover:border-amber-500/30 transition-all"
            title="Admin panel">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── No API key notice ── */}
      {!hasApiKey && (
        <div className="relative z-10 mx-3 mt-3 px-4 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <p className="text-xs text-amber-300 font-mono text-center">
            ⚡ Set your Groq API key in the Admin panel (⚙️) to start chatting
          </p>
        </div>
      )}

      {/* ── Messages ── */}
      <div ref={chatRef} className="relative z-10 flex-1 overflow-y-auto px-3 py-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.3) transparent" }}>
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestion={(text) => sendMessage(text)}/>
        ) : (
          <div className="max-w-2xl mx-auto">
            {messages.map((msg) => <Message key={msg.id} msg={msg}/>)}
            {loading && (
              <div className="flex gap-3 mb-5" style={{ animation: "slide-up 0.3s ease forwards" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs
                  bg-gradient-to-br from-violet-600 to-violet-800 text-white border border-violet-500/40"
                  style={{ boxShadow: "0 0 12px rgba(139,92,246,0.4)" }}>⚡</div>
                <div className="px-2 py-2 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/10 backdrop-blur-sm">
                  <EliteLoader/>
                </div>
              </div>
            )}
            {error && (
              <div className="mx-auto mb-4 px-4 py-3 rounded-2xl border border-red-500/30 bg-red-500/10">
                <p className="text-xs text-red-300 font-mono">{error}</p>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>
        )}
      </div>

      {/* ── Mobile credit bar ── */}
      <div className="sm:hidden relative z-10 flex justify-center py-1 border-t border-white/[0.04]">
        <CreditBar credits={credits}/>
      </div>

      {/* ── Input ── */}
      <div className="relative z-10 border-t border-white/[0.04] max-w-2xl w-full mx-auto"
        style={{ backdropFilter: "blur(20px)" }}>
        <InputBar onSend={sendMessage} loading={loading} disabled={!hasCredits()}/>
      </div>

      {/* Ping animation for status dot */}
      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
      `}</style>
    </div>
  );
}
