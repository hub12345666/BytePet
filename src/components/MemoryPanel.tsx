import { CalendarDays, ChevronLeft, Copy, MessageCircle, Pencil, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CharacterProfile, ChatHistoryDay, ChatMessage, ChatSession } from "../types/domain";
import { chatHistoryDays, chatHistoryMessagesForDay } from "../storage/database/tauriClient";
import { PanelShell } from "./PanelShell";

interface MemoryPanelProps {
  character: CharacterProfile | null;
  characters: CharacterProfile[];
  sessions: ChatSession[];
  messages: ChatMessage[];
  onDeleteSession: (sessionId: string) => Promise<void>;
  onDeleteHistoryDay: (dateKey: string) => Promise<void>;
  onSwitchCharacter: (characterId: string) => Promise<void>;
  onManageCharacters: () => void;
  onClose: () => void;
}

function parseDate(value: string): Date {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function formatDateKey(value: string): string {
  const date = parseDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(key: string): string {
  const today = formatDateKey(new Date().toISOString());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateKey(yesterdayDate.toISOString());
  if (key === today) return "今天";
  if (key === yesterday) return "昨天";
  return key;
}

function formatTime(value: string): string {
  const date = parseDate(value);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role: string): string {
  if (role === "assistant") return "AI";
  if (role === "user") return "你";
  return role;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

export function MemoryPanel({
  character,
  characters,
  sessions,
  messages,
  onDeleteSession: _onDeleteSession,
  onDeleteHistoryDay,
  onSwitchCharacter,
  onManageCharacters,
  onClose,
}: MemoryPanelProps) {
  const [tab, setTab] = useState<"history" | "profiles">("history");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [historyDays, setHistoryDays] = useState<ChatHistoryDay[]>([]);
  const [dayMessages, setDayMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [pendingDeleteDayKey, setPendingDeleteDayKey] = useState<string | null>(null);

  const profileCharacter = selectedCharacterId
    ? characters.find((item) => item.id === selectedCharacterId) ?? character
    : character;

  const selectedDay = useMemo(
    () => historyDays.find((day) => day.dateKey === selectedDayKey) ?? null,
    [historyDays, selectedDayKey]
  );

  const filteredMessages = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return dayMessages;
    return dayMessages.filter((message) => `${roleLabel(message.role)} ${message.content}`.toLowerCase().includes(keyword));
  }, [query, dayMessages]);

  useEffect(() => {
    if (tab !== "history" || !character) return;
    let disposed = false;

    async function loadDays(): Promise<void> {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const days = await chatHistoryDays();
        if (!disposed) setHistoryDays(days);
      } catch (error) {
        if (!disposed) setHistoryError(error instanceof Error ? error.message : "历史聊天加载失败");
      } finally {
        if (!disposed) setHistoryLoading(false);
      }
    }

    void loadDays();
    return () => {
      disposed = true;
    };
  }, [tab, character?.id, messages.length]);

  useEffect(() => {
    if (!selectedDayKey) {
      setDayMessages([]);
      return;
    }

    const dateKey = selectedDayKey;
    let disposed = false;
    async function loadMessages(): Promise<void> {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const items = await chatHistoryMessagesForDay(dateKey);
        if (!disposed) setDayMessages(items);
      } catch (error) {
        if (!disposed) setHistoryError(error instanceof Error ? error.message : "当天聊天加载失败");
      } finally {
        if (!disposed) setHistoryLoading(false);
      }
    }

    void loadMessages();
    return () => {
      disposed = true;
    };
  }, [selectedDayKey, character?.id, messages.length]);

  const handleDeleteDay = async (day: ChatHistoryDay): Promise<void> => {
    if (pendingDeleteDayKey !== day.dateKey) {
      setPendingDeleteDayKey(day.dateKey);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      await onDeleteHistoryDay(day.dateKey);
      const days = await chatHistoryDays();
      setHistoryDays(days);
      if (selectedDayKey === day.dateKey) {
        setSelectedDayKey(null);
        setDayMessages([]);
        setQuery("");
      }
      setPendingDeleteDayKey(null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCopyMessage = async (message: ChatMessage): Promise<void> => {
    await copyText(message.content);
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId((current) => (current === message.id ? null : current)), 1200);
  };

  return (
    <PanelShell title="记忆" subtitle={character ? `${character.name} 的独立记忆` : "人物存档"} onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="grid grid-cols-2 rounded-[8px] bg-sky-50 p-1 text-[12px] font-semibold">
          <button className={`h-8 rounded-[8px] ${tab === "history" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`} type="button" onClick={() => setTab("history")}>
            历史聊天
          </button>
          <button className={`h-8 rounded-[8px] ${tab === "profiles" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`} type="button" onClick={() => setTab("profiles")}>
            人物存档
          </button>
        </div>

        {tab === "history" ? (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-[8px] border border-sky-100 bg-white/64 p-3">
            {historyError ? <p className="mb-2 rounded-[8px] bg-rose-50 px-2 py-1.5 text-[11px] text-rose-600">{historyError}</p> : null}
            {selectedDay ? (
              <div className="flex min-h-0 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button className="grid h-7 w-7 place-items-center rounded-[8px] border border-sky-100 bg-white text-sky-700" type="button" title="返回" onClick={() => setSelectedDayKey(null)}>
                    <ChevronLeft size={15} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-700">{formatDateLabel(selectedDay.dateKey)}</p>
                    <p className="text-[10px] text-slate-400">{dayMessages.length || selectedDay.messageCount} 条消息 · {character?.name ?? "当前人物"}</p>
                  </div>
                  <button className="grid h-7 w-7 place-items-center rounded-[8px] border border-rose-100 bg-rose-50 text-rose-500" type="button" title="删除" onClick={() => void handleDeleteDay(selectedDay)}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {pendingDeleteDayKey === selectedDay.dateKey ? (
                  <div className="rounded-[8px] border border-rose-100 bg-rose-50 px-2 py-2">
                    <p className="text-[11px] leading-relaxed text-rose-600">确认删除 {formatDateLabel(selectedDay.dateKey)} 的聊天记录？删除后无法恢复。</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button className="h-7 rounded-[8px] border border-rose-200 bg-white text-[11px] font-semibold text-rose-600" type="button" onClick={() => void handleDeleteDay(selectedDay)}>
                        确认删除
                      </button>
                      <button className="h-7 rounded-[8px] border border-sky-100 bg-white text-[11px] font-semibold text-slate-500" type="button" onClick={() => setPendingDeleteDayKey(null)}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : null}

                <label className="flex h-9 items-center gap-2 rounded-[8px] border border-sky-100 bg-white/80 px-2 text-[11px] text-slate-500">
                  <Search size={14} className="shrink-0 text-sky-500" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="查找当天聊天"
                  />
                </label>

                <div className="space-y-2">
                  {historyLoading && !dayMessages.length ? <p className="rounded-[8px] bg-white/70 p-3 text-[12px] text-slate-400">正在加载...</p> : null}
                  {filteredMessages.length ? filteredMessages.map((message) => (
                    <div key={message.id} className="rounded-[8px] bg-white/78 px-2 py-1.5 text-[11px] text-slate-600">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-semibold text-sky-700">{roleLabel(message.role)}</span>
                        <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
                        <button className="ml-auto inline-flex items-center gap-1 rounded-[6px] border border-sky-100 bg-white px-1.5 py-0.5 text-[10px] text-sky-700" type="button" onClick={() => void handleCopyMessage(message)}>
                          <Copy size={11} />
                          {copiedMessageId === message.id ? "已复制" : "复制"}
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    </div>
                  )) : !historyLoading ? <p className="rounded-[8px] bg-white/70 p-3 text-[12px] text-slate-400">没有匹配的聊天内容。</p> : null}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {historyLoading && !historyDays.length ? <p className="rounded-[8px] bg-white/70 p-3 text-[12px] text-slate-400">正在加载历史聊天...</p> : null}
                {historyDays.length ? historyDays.map((day) => (
                  <div key={day.dateKey} className="rounded-[8px] border border-sky-100 bg-white/76 p-2 transition hover:border-sky-200 hover:bg-white">
                    <div className="flex items-start gap-2">
                      <button
                        className="min-w-0 flex flex-1 items-start gap-2 text-left"
                        type="button"
                        onClick={() => {
                          setSelectedDayKey(day.dateKey);
                          setPendingDeleteDayKey(null);
                          setQuery("");
                        }}
                      >
                        <MessageCircle size={14} className="mt-0.5 shrink-0 text-sky-500" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={13} className="shrink-0 text-violet-500" />
                            <p className="truncate text-[12px] font-semibold text-slate-700">{formatDateLabel(day.dateKey)}</p>
                            <span className="ml-auto shrink-0 text-[10px] text-slate-400">{day.messageCount} 条</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{day.preview || "暂无聊天内容"}</p>
                        </div>
                      </button>
                      <button className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-rose-100 bg-rose-50 text-rose-500" type="button" title="删除" onClick={() => void handleDeleteDay(day)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {pendingDeleteDayKey === day.dateKey ? (
                      <div className="mt-2 rounded-[8px] border border-rose-100 bg-rose-50 px-2 py-2">
                        <p className="text-[11px] leading-relaxed text-rose-600">确认删除 {formatDateLabel(day.dateKey)} 的聊天记录？删除后无法恢复。</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button className="h-7 rounded-[8px] border border-rose-200 bg-white text-[11px] font-semibold text-rose-600" type="button" onClick={() => void handleDeleteDay(day)}>
                            确认删除
                          </button>
                          <button className="h-7 rounded-[8px] border border-sky-100 bg-white text-[11px] font-semibold text-slate-500" type="button" onClick={() => setPendingDeleteDayKey(null)}>
                            取消
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )) : !historyLoading ? <p className="rounded-[8px] bg-white/70 p-3 text-[12px] text-slate-400">这个人物还没有聊天记录。</p> : null}
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {characters.map((profile) => {
                const isLoaded = character?.id === profile.id;
                const count = isLoaded ? messages.filter((message) => message.characterId === profile.id).length : 0;
                const profileSessions = isLoaded ? sessions.filter((session) => session.characterId === profile.id).length : 0;
                const selected = profileCharacter?.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    className={`w-full rounded-[8px] border p-3 text-left transition ${
                      selected ? "border-sky-300 bg-sky-50/80" : "border-sky-100 bg-white/72 hover:bg-white/88"
                    }`}
                    type="button"
                    onClick={() => setSelectedCharacterId(profile.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                          <UserRound size={14} />
                          <span className="truncate">{profile.name}</span>
                          {profile.isActive ? <span className="text-[10px] text-emerald-600">当前</span> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                          {profile.memorySummary || "暂无记忆摘要"}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {isLoaded ? `${profileSessions} 个会话 · 最近 ${count} 条消息` : "切换后查看聊天记录"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <span
                          className="grid h-7 w-7 place-items-center rounded-[8px] border border-sky-100 bg-white text-sky-700"
                          title="去人物页编辑"
                          onClick={(event) => {
                            event.stopPropagation();
                            onManageCharacters();
                          }}
                        >
                          <Pencil size={13} />
                        </span>
                        <span
                          className={`h-7 rounded-[8px] border px-2 pt-1.5 text-[11px] font-semibold ${
                            profile.isActive ? "border-slate-100 bg-white text-slate-300" : "border-sky-100 bg-white text-sky-700"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!profile.isActive) void onSwitchCharacter(profile.id);
                          }}
                        >
                          切换
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
