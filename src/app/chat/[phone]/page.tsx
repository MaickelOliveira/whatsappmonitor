"use client";

import { useEffect, useState, useRef, use } from "react";
import Sidebar, { Avatar } from "@/components/Sidebar";

type Message = {
  id: string;
  content: string;
  direction: string;
  senderType: string;
  timestamp: string;
};

type Conversation = {
  id: string;
  phoneNumber: string;
  contactName: string | null;
  messages: Message[];
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function MessageBubble({ msg }: { msg: Message }) {
  const isIncoming = msg.direction === "incoming";

  if (isIncoming) {
    return (
      <div className="flex items-end gap-2 self-start max-w-[70%]">
        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm">
          <p className="text-sm text-[#111b21] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          <p className="text-[10px] text-[#8696a0] mt-1 text-right">{formatTime(msg.timestamp)}</p>
        </div>
      </div>
    );
  }

  const isHuman = msg.senderType === "human";
  const bubbleBg = isHuman ? "bg-[#dce8ff]" : "bg-[#d9fdd3]";
  const label = isHuman ? "Você (operador)" : "IA";
  const labelColor = isHuman ? "text-blue-600" : "text-[#00a884]";

  return (
    <div className="flex flex-col items-end self-end max-w-[70%]">
      <div className={`${bubbleBg} rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm`}>
        <p className={`text-[10px] font-semibold ${labelColor} mb-1`}>{label}</p>
        <p className="text-sm text-[#111b21] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
        <p className="text-[10px] text-[#8696a0] mt-1 text-right">{formatTime(msg.timestamp)}</p>
      </div>
    </div>
  );
}

export default function ChatPage({ params }: { params: Promise<{ phone: string }> }) {
  const { phone } = use(params);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = async () => {
    const res = await fetch(`/api/conversations/${phone}/messages`);
    if (res.ok) setConversation(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    const es = new EventSource(`/api/stream?phone=${phone}`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "new_message") fetchMessages();
    };
    return () => es.close();
  }, [phone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  const handleSend = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    setError("");
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone, content: reply.trim() }),
    });
    if (res.ok) {
      setReply("");
      textareaRef.current?.focus();
      await fetchMessages();
    } else {
      const data = await res.json();
      setError(data.error ?? "Erro ao enviar");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groups = () => {
    if (!conversation) return [];
    const result: { date: string; messages: Message[] }[] = [];
    let current = "";
    for (const msg of conversation.messages) {
      const d = formatDate(msg.timestamp);
      if (d !== current) { current = d; result.push({ date: d, messages: [] }); }
      result[result.length - 1].messages.push(msg);
    }
    return result;
  };

  const displayName = conversation?.contactName ?? phone;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePhone={phone} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 flex-shrink-0 border-b border-[#e9edef]">
          {loading ? (
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          ) : (
            <>
              <Avatar name={displayName} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#111b21] text-sm leading-tight truncate">{displayName}</p>
                <p className="text-xs text-[#8696a0] truncate">
                  {conversation?.contactName ? phone : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#d9fdd3] px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-[#00a884] rounded-full"></span>
                <span className="text-xs font-medium text-[#00a884]">IA ativa</span>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ backgroundImage: "radial-gradient(circle, #d4d4d4 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundColor: "#efeae2" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-[#8696a0] text-sm">
              Carregando mensagens...
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-w-3xl mx-auto">
              {groups().map((group) => (
                <div key={group.date}>
                  <div className="flex justify-center my-4">
                    <span className="bg-white text-[#54656f] text-xs px-4 py-1.5 rounded-full shadow-sm font-medium">
                      {group.date}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {group.messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-[#f0f2f5] px-4 py-3 flex-shrink-0 border-t border-[#e9edef]">
          {error && <p className="text-red-500 text-xs mb-2 px-1">{error}</p>}
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <div className="flex-1 bg-white rounded-2xl flex items-end px-4 py-2.5 shadow-sm">
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem como operador..."
                rows={1}
                className="flex-1 resize-none text-sm text-[#111b21] placeholder-[#8696a0] focus:outline-none max-h-32 overflow-y-auto bg-transparent leading-relaxed"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!reply.trim() || sending}
              className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#008f71] transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 translate-x-0.5">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[#8696a0] text-center mt-2">
            Mensagens enviadas aqui vão diretamente para o cliente via WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
