"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Pusher, { Channel as PusherChannel } from "pusher-js";
import {
  listMyChannels, getChannelMessages, sendMessage, markChannelRead,
  searchChatUsers, getOrCreateDirectMessage, createChannel,
  deleteMessage, listChannelMembers, removeChannelMember, addChannelMember,
  type ChatChannelSummary, type ChatMessageDto, type ChatUserResult, type ChatChannelMemberDto,
} from "./actions";

type CurrentUser = { id: number; username: string | null; isAdmin: boolean };

function channelDisplayName(c: ChatChannelSummary): string {
  if (c.type === "dm") return c.otherMember?.username ?? c.otherMember?.email ?? "Unbekannt";
  return c.name ?? "Channel";
}

function formatTime(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatClient({ currentUser, initialChannels }: { currentUser: CurrentUser; initialChannels: ChatChannelSummary[] }) {
  const [channels, setChannels] = useState<ChatChannelSummary[]>(initialChannels);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [mobileShowList, setMobileShowList] = useState(true);

  const pusherRef = useRef<Pusher | null>(null);
  const activeBindingRef = useRef<PusherChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeChannel = channels.find((c) => c.id === activeId) ?? null;

  const refreshChannels = useCallback(async () => {
    const fresh = await listMyChannels();
    setChannels(fresh);
  }, []);

  // Pusher-Verbindung + persönlicher Kanal für "neuer Channel/DM erstellt"
  // einmalig beim Mounten aufbauen.
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      console.error("Pusher ist nicht konfiguriert (NEXT_PUBLIC_PUSHER_KEY/CLUSTER fehlen).");
      return;
    }
    const pusher = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" });
    pusherRef.current = pusher;

    const userChannel = pusher.subscribe(`private-chat-user-${currentUser.id}`);
    userChannel.bind("new-channel", () => {
      refreshChannels();
    });
    userChannel.bind("removed-from-channel", (data: { channelId: number }) => {
      refreshChannels();
      setActiveId((prev) => (prev === data.channelId ? null : prev));
    });

    return () => {
      pusher.unsubscribe(`private-chat-user-${currentUser.id}`);
      pusher.disconnect();
    };
  }, [currentUser.id, refreshChannels]);

  // Beim Wechsel des aktiven Channels: alte Subscription lösen, Verlauf
  // laden, neue Subscription für Live-Nachrichten aufbauen, als gelesen
  // markieren.
  useEffect(() => {
    if (activeBindingRef.current) {
      activeBindingRef.current.unbind_all();
      pusherRef.current?.unsubscribe(activeBindingRef.current.name);
      activeBindingRef.current = null;
    }
    if (!activeId || !pusherRef.current) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    getChannelMessages(activeId).then((res) => {
      setMessages(res.messages ?? []);
      setLoadingMessages(false);
    });
    markChannelRead(activeId).then(() => {
      setChannels((prev) => prev.map((c) => (c.id === activeId ? { ...c, unread: false } : c)));
    });

    const binding = pusherRef.current.subscribe(`private-chat-${activeId}`);
    binding.bind("new-message", (msg: ChatMessageDto) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.userId !== currentUser.id) {
        markChannelRead(activeId);
      }
      setChannels((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, lastMessage: { body: msg.body, createdAt: msg.createdAt, authorUsername: msg.username }, unread: false }
            : c,
        ),
      );
    });
    binding.bind("message-deleted", (data: { id: number }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.id));
    });
    activeBindingRef.current = binding;
  }, [activeId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !activeId || sending) return;
    setSending(true);
    const body = draft;
    setDraft("");
    try {
      const fd = new FormData();
      fd.append("channelId", String(activeId));
      fd.append("body", body);
      const res = await sendMessage(fd);
      if (res?.error) {
        setDraft(body);
        alert(res.error);
      }
    } finally {
      setSending(false);
    }
  }

  function selectChannel(id: number) {
    setActiveId(id);
    setMobileShowList(false);
  }

  async function handleDelete(messageId: number) {
    if (!confirm("Nachricht wirklich löschen?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    const fd = new FormData();
    fd.append("messageId", String(messageId));
    const res = await deleteMessage(fd);
    if (res?.error) alert(res.error);
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white font-mono overflow-hidden">
      <header className="shrink-0 border-b border-zinc-800 bg-black/95 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!mobileShowList && (
            <button onClick={() => setMobileShowList(true)} className="sm:hidden text-zinc-400 hover:text-white">
              ←
            </button>
          )}
          <Link href="/" className="text-lg font-black uppercase tracking-tighter italic hover:opacity-70 transition">
            BELLATOR.
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 border-l border-zinc-800 pl-3">Team-Chat</span>
        </div>
        <Link href="/" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition">
          Zur Seite →
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Channel-/DM-Liste */}
        <aside className={`w-full sm:w-72 shrink-0 border-r border-zinc-800 flex-col overflow-y-auto ${mobileShowList ? "flex" : "hidden sm:flex"}`}>
          <div className="p-3 border-b border-zinc-800">
            <button
              onClick={() => setShowNewModal(true)}
              className="w-full border border-zinc-600 text-[10px] uppercase tracking-widest font-bold py-2.5 hover:bg-white hover:text-black transition-all"
            >
              + Neuer Chat
            </button>
          </div>
          <div className="flex-1">
            {channels.length === 0 ? (
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest p-4">Noch keine Chats. Starte einen neuen.</p>
            ) : (
              channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectChannel(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-900 hover:bg-zinc-900 transition-all ${activeId === c.id ? "bg-zinc-900" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {c.type === "dm" ? "@" : "#"}{channelDisplayName(c)}
                    </span>
                    {c.unread && <span className="w-2 h-2 rounded-full bg-white shrink-0" />}
                  </div>
                  {c.lastMessage && (
                    <p className="text-xs text-zinc-500 truncate mt-1">
                      {c.lastMessage.authorUsername ? `${c.lastMessage.authorUsername}: ` : ""}{c.lastMessage.body}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <main className={`flex-1 flex-col ${mobileShowList ? "hidden sm:flex" : "flex"}`}>
          {!activeChannel ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-zinc-600 uppercase tracking-widest">Wähle einen Chat aus</p>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-tight text-white">
                  {activeChannel.type === "dm" ? "@" : "#"}{channelDisplayName(activeChannel)}
                </p>
                {activeChannel.type === "channel" && (
                  <button
                    onClick={() => setShowMembersPanel(true)}
                    className="text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-700 px-2.5 py-1.5 hover:border-zinc-400 hover:text-white transition"
                  >
                    Mitglieder
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingMessages ? (
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Lädt...</p>
                ) : messages.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Noch keine Nachrichten. Schreib die erste.</p>
                ) : (
                  messages.map((m) => {
                    const own = m.userId === currentUser.id;
                    return (
                      <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"} group`}>
                        <div className={`max-w-[80%] sm:max-w-[60%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                          {!own && <span className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{m.username ?? "?"}</span>}
                          <div className="flex items-center gap-1.5">
                            {own && (
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-600 hover:text-red-500 transition"
                                title="Löschen"
                              >
                                ✕
                              </button>
                            )}
                            <div className={`px-3 py-2 text-sm break-words ${own ? "bg-white text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-200"}`}>
                              {m.body}
                            </div>
                          </div>
                          <span className="text-[9px] text-zinc-700 mt-1">{formatTime(m.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="shrink-0 border-t border-zinc-800 p-3 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="border border-white bg-white text-black px-5 py-2.5 text-[10px] uppercase tracking-widest font-black hover:bg-black hover:text-white transition-all disabled:opacity-40"
                >
                  Senden
                </button>
              </form>
            </>
          )}
        </main>
      </div>

      {showNewModal && (
        <NewChatModal
          onClose={() => setShowNewModal(false)}
          onCreated={async (channelId) => {
            await refreshChannels();
            setShowNewModal(false);
            selectChannel(channelId);
          }}
        />
      )}

      {showMembersPanel && activeChannel && (
        <MembersPanel
          channelId={activeChannel.id}
          currentUserId={currentUser.id}
          onClose={() => setShowMembersPanel(false)}
        />
      )}
    </div>
  );
}

function NewChatModal({ onClose, onCreated }: { onClose: () => void; onCreated: (channelId: number) => void }) {
  const [tab, setTab] = useState<"dm" | "channel">("dm");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatUserResult[]>([]);
  const [selected, setSelected] = useState<ChatUserResult[]>([]);
  const [channelName, setChannelName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;
    searchChatUsers(query).then((res) => {
      if (active) setResults(res);
    });
    return () => {
      active = false;
    };
  }, [query]);

  async function startDm(user: ChatUserResult) {
    setBusy(true);
    setErr("");
    try {
      const res = await getOrCreateDirectMessage(user.id);
      if (res.error) {
        setErr(res.error);
        return;
      }
      if (res.channelId) onCreated(res.channelId);
    } finally {
      setBusy(false);
    }
  }

  function toggleSelect(user: ChatUserResult) {
    setSelected((prev) => (prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]));
  }

  async function submitChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("name", channelName.trim());
      fd.append("memberIds", selected.map((u) => u.id).join(","));
      const res = await createChannel(fd);
      if (res.error) {
        setErr(res.error);
        return;
      }
      if (res.channelId) onCreated(res.channelId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-black border border-zinc-700 w-full max-w-md max-h-[80vh] flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setTab("dm")}
            className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition ${tab === "dm" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
          >
            Direktnachricht
          </button>
          <button
            onClick={() => setTab("channel")}
            className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition ${tab === "channel" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
          >
            Gruppen-Channel
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}

          {tab === "dm" ? (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Team-Mitglied suchen..."
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white outline-none transition"
              />
              <div className="space-y-1">
                {results.map((u) => (
                  <button
                    key={u.id}
                    disabled={busy}
                    onClick={() => startDm(u)}
                    className="w-full text-left px-3 py-2.5 border border-zinc-800 hover:border-zinc-500 transition text-sm disabled:opacity-50"
                  >
                    {u.username ?? u.email}
                  </button>
                ))}
                {query && results.length === 0 && (
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Keine Treffer mit Chat-Zugriff.</p>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={submitChannel} className="space-y-3">
              <input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Channel-Name"
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white outline-none transition"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mitglieder suchen..."
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white outline-none transition"
              />
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((u) => (
                    <span key={u.id} onClick={() => toggleSelect(u)} className="text-[10px] border border-white px-2 py-1 uppercase tracking-widest cursor-pointer hover:bg-white hover:text-black transition">
                      {u.username ?? u.email} ✕
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {results.filter((u) => !selected.some((s) => s.id === u.id)).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleSelect(u)}
                    className="w-full text-left px-3 py-2 border border-zinc-800 hover:border-zinc-500 transition text-sm"
                  >
                    {u.username ?? u.email}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!channelName.trim() || busy}
                className="w-full border border-white bg-white text-black py-2.5 text-[10px] uppercase tracking-widest font-black hover:bg-black hover:text-white transition-all disabled:opacity-40"
              >
                Channel erstellen
              </button>
            </form>
          )}
        </div>

        <div className="border-t border-zinc-800 p-3">
          <button onClick={onClose} className="w-full text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition py-1.5">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function MembersPanel({ channelId, currentUserId, onClose }: { channelId: number; currentUserId: number; onClose: () => void }) {
  const [members, setMembers] = useState<ChatChannelMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatUserResult[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listChannelMembers(channelId);
    if (res.error) setErr(res.error);
    setMembers(res.members ?? []);
    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;
    searchChatUsers(query).then((res) => {
      if (active) setResults(res.filter((u) => !members.some((m) => m.id === u.id)));
    });
    return () => {
      active = false;
    };
  }, [query, members]);

  async function handleAdd(userId: number) {
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("channelId", String(channelId));
      fd.append("userId", String(userId));
      const res = await addChannelMember(fd);
      if (res.error) {
        setErr(res.error);
        return;
      }
      await load();
      setQuery("");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId: number) {
    if (!confirm("Dieses Mitglied wirklich aus dem Channel entfernen?")) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("channelId", String(channelId));
      fd.append("userId", String(userId));
      const res = await removeChannelMember(fd);
      if (res.error) {
        setErr(res.error);
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  const amCreator = members.some((m) => m.id === currentUserId && m.isCreator);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-black border border-zinc-700 w-full max-w-md max-h-[80vh] flex flex-col font-mono" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-zinc-800 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-white">Mitglieder</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {err && <p className="text-[10px] text-red-500 uppercase tracking-widest">{err}</p>}
          {loading ? (
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Lädt...</p>
          ) : (
            <div className="space-y-1">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2 border border-zinc-800 text-sm">
                  <span>
                    {m.username ?? m.email} {m.isCreator && <span className="text-[9px] text-zinc-500 uppercase tracking-widest ml-1">(Ersteller)</span>}
                  </span>
                  {!m.isCreator && amCreator && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={busy}
                      className="text-[10px] text-zinc-600 hover:text-red-500 transition disabled:opacity-50"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mitglied hinzufügen..."
              className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-white outline-none transition"
            />
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {results.map((u) => (
                <button
                  key={u.id}
                  disabled={busy}
                  onClick={() => handleAdd(u.id)}
                  className="w-full text-left px-3 py-2 border border-zinc-800 hover:border-zinc-500 transition text-sm disabled:opacity-50"
                >
                  + {u.username ?? u.email}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 p-3">
          <button onClick={onClose} className="w-full text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition py-1.5">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
