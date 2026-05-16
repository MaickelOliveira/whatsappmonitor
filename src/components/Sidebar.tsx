"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  lastMessageAt: string;
  messages: Message[];
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const colors = ["#00a884", "#0b6fcb", "#9c27b0", "#e91e63", "#ff5722", "#795548"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-8 h-8 text-sm" : "w-11 h-11 text-base";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white`}
      style={{ backgroundColor: color }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export { Avatar };

export default function Sidebar({ activePhone }: { activePhone?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [readTimes, setReadTimes] = useState<Record<string, string>>({});
  const esRef = useRef<EventSource | null>(null);
  const router = useRouter();

  const fetchConversations = async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) setConversations(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem("wa_read_times");
    if (stored) setReadTimes(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!activePhone) return;
    setReadTimes((prev) => {
      const next = { ...prev, [activePhone]: new Date().toISOString() };
      localStorage.setItem("wa_read_times", JSON.stringify(next));
      return next;
    });
  }, [activePhone]);

  useEffect(() => {
    fetchConversations();
    const es = new EventSource("/api/stream");
    esRef.current = es;
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "new_message") fetchConversations();
    };
    return () => es.close();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.contactName ?? "").toLowerCase().includes(q) ||
      c.phoneNumber.includes(q)
    );
  });

  return (
    <aside className="w-[360px] flex-shrink-0 flex flex-col border-r border-[#e9edef] bg-white h-screen">
      {/* Header */}
      <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </div>
          <span className="font-semibold text-[#111b21] text-sm">WhatsApp Monitor</span>
        </div>
        <button
          onClick={handleLogout}
          title="Sair"
          className="p-2 rounded-full hover:bg-[#e9edef] transition-colors text-[#54656f]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-lg px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[#54656f] flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar conversas"
            className="bg-transparent text-sm text-[#111b21] placeholder-[#8696a0] focus:outline-none flex-1"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#8696a0] text-sm">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-[#f0f2f5] rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth={1.5} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-[#54656f] text-sm font-medium">Nenhuma conversa</p>
            <p className="text-[#8696a0] text-xs mt-1">As mensagens aparecerão aqui</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const last = conv.messages[0];
            const isActive = conv.phoneNumber === activePhone;
            const lastReadAt = readTimes[conv.phoneNumber];
            const isUnread =
              !isActive &&
              last?.direction === "incoming" &&
              (!lastReadAt || new Date(conv.lastMessageAt) > new Date(lastReadAt));
            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.phoneNumber}`}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#f0f2f5] ${
                  isActive ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                }`}
              >
                <Avatar name={conv.contactName ?? conv.phoneNumber} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${isUnread ? "font-semibold text-[#111b21]" : "font-medium text-[#111b21]"}`}>
                      {conv.contactName ?? conv.phoneNumber}
                    </span>
                    <span className={`text-xs ml-2 flex-shrink-0 ${isUnread ? "text-[#00a884] font-medium" : "text-[#8696a0]"}`}>
                      {timeAgo(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    {last && (
                      <p className="text-xs text-[#8696a0] truncate flex items-center gap-1">
                        {last.senderType === "ai" && (
                          <span className="text-[#00a884] font-medium">[IA]</span>
                        )}
                        {last.senderType === "human" && (
                          <span className="text-blue-500 font-medium">[Você]</span>
                        )}
                        {last.content}
                      </p>
                    )}
                    {isUnread && (
                      <div className="w-5 h-5 bg-[#00a884] rounded-full flex-shrink-0 ml-2 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">●</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
