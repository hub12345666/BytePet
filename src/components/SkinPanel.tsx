import { CheckCircle2, FolderOpen, Pencil, Trash2, UploadCloud, UserRoundPlus } from "lucide-react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CharacterProfile,
  CreateCharacterRequest,
  FrameAssetOption,
  UpdateCharacterRequest,
} from "../types/domain";
import { PanelShell } from "./PanelShell";

interface SkinPanelProps {
  character: CharacterProfile | null;
  characters: CharacterProfile[];
  frameAssets: FrameAssetOption[];
  onChooseAndImportFrameAsset: () => Promise<FrameAssetOption | null>;
  onImportFrameAssetFromPath: (path: string) => Promise<FrameAssetOption>;
  onDeleteFrameAsset: (assetId: string) => Promise<void>;
  onCreateCharacter: (request: CreateCharacterRequest) => Promise<void>;
  onSwitchCharacter: (characterId: string) => Promise<void>;
  onUpdateCharacter: (request: UpdateCharacterRequest) => Promise<void>;
  onPreviewCharacterScale: (characterId: string, displayScale: number) => void;
  onUpdateCharacterScale: (characterId: string, displayScale: number) => Promise<void>;
  onDeleteCharacter: (characterId: string) => Promise<void>;
  onClose: () => void;
}

type Mode = "create" | "edit";
const MIN_CHARACTER_SCALE = 0.75;
const MAX_CHARACTER_SCALE = 3;
const CHARACTER_SCALE_STEP = 0.05;

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

export function SkinPanel({
  character,
  characters,
  frameAssets,
  onChooseAndImportFrameAsset,
  onImportFrameAssetFromPath,
  onDeleteFrameAsset,
  onCreateCharacter,
  onSwitchCharacter,
  onUpdateCharacter,
  onPreviewCharacterScale,
  onUpdateCharacterScale,
  onDeleteCharacter,
  onClose,
}: SkinPanelProps) {
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("rick_default");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteAssetId, setPendingDeleteAssetId] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const scaleSaveTimers = useRef<Record<string, number>>({});

  const editingCharacter = useMemo(
    () => characters.find((item) => item.id === editingId) ?? null,
    [characters, editingId]
  );
  const selectedAsset = frameAssets.find((asset) => asset.id === selectedAssetId) ?? frameAssets[0];
  const selectedAssetUsers = selectedAsset
    ? characters.filter((profile) => profile.skinId === selectedAsset.id)
    : [];
  const canDeleteSelectedAsset =
    Boolean(selectedAsset) &&
    !selectedAsset?.builtIn &&
    frameAssets.length > 1 &&
    selectedAssetUsers.length === 0;

  useEffect(() => {
    return () => {
      Object.values(scaleSaveTimers.current).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const scheduleScaleSave = useCallback(
    (characterId: string, displayScale: number) => {
      const previousTimer = scaleSaveTimers.current[characterId];
      if (previousTimer) {
        window.clearTimeout(previousTimer);
      }
      scaleSaveTimers.current[characterId] = window.setTimeout(() => {
        void onUpdateCharacterScale(characterId, displayScale).catch((err) => {
          setError(errorMessage(err, "角色大小保存失败"));
        });
      }, 260);
    },
    [onUpdateCharacterScale]
  );

  const updateScale = useCallback(
    (profile: CharacterProfile, rawScale: number) => {
      if (!profile.isActive) return;
      const displayScale = Math.min(MAX_CHARACTER_SCALE, Math.max(MIN_CHARACTER_SCALE, rawScale));
      onPreviewCharacterScale(profile.id, displayScale);
      scheduleScaleSave(profile.id, displayScale);
    },
    [onPreviewCharacterScale, scheduleScaleSave]
  );

  useEffect(() => {
    if (mode === "edit" && editingCharacter) {
      setName(editingCharacter.name);
      setPrompt(editingCharacter.prompt || editingCharacter.description);
      const match = frameAssets.find(
        (asset) =>
          asset.id === editingCharacter.skinId ||
          (asset.path && asset.path === editingCharacter.frameAssetsPath)
      );
      setSelectedAssetId(match?.id ?? "rick_default");
      setError(null);
    }
  }, [editingCharacter, frameAssets, mode]);

  function resetCreateForm(): void {
    setMode("create");
    setEditingId(null);
    setName("");
    setPrompt("");
    setSelectedAssetId("rick_default");
    setError(null);
    setPendingDeleteId(null);
    setPendingDeleteAssetId(null);
  }

  function editProfile(profile: CharacterProfile): void {
    setMode("edit");
    setEditingId(profile.id);
    setPendingDeleteId(null);
  }

  const isInsideDropZone = useCallback((x: number, y: number): boolean => {
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (!rect) return false;
    const scale = window.devicePixelRatio || 1;
    const cssX = x / scale;
    const cssY = y / scale;
    return cssX >= rect.left && cssX <= rect.right && cssY >= rect.top && cssY <= rect.bottom;
  }, []);

  const importPath = useCallback(
    async (path: string): Promise<void> => {
      if (!path || importing) return;
      setImporting(true);
      setError(null);
      try {
        const asset = await onImportFrameAssetFromPath(path);
        setSelectedAssetId(asset.id);
        setPendingDeleteAssetId(null);
      } catch (err) {
        setError(errorMessage(err, "导入失败"));
      } finally {
        setImporting(false);
        setDragActive(false);
      }
    },
    [importing, onImportFrameAssetFromPath]
  );

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        const payload = event.payload;
        if (payload.type === "enter" || payload.type === "over") {
          setDragActive(isInsideDropZone(payload.position.x, payload.position.y));
          return;
        }
        if (payload.type === "leave") {
          setDragActive(false);
          return;
        }
        if (payload.type === "drop") {
          const inside = isInsideDropZone(payload.position.x, payload.position.y);
          setDragActive(false);
          if (inside && payload.paths[0]) {
            void importPath(payload.paths[0]);
          }
        }
      })
      .then((fn) => {
        if (cancelled) {
          fn();
        } else {
          unlisten = fn;
        }
      })
      .catch(() => {
        // Browser preview does not expose the Tauri drag-drop event API.
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [importPath, isInsideDropZone]);

  async function importFromFolderPicker(): Promise<void> {
    setImporting(true);
    setError(null);
    try {
      const asset = await onChooseAndImportFrameAsset();
      if (asset) setSelectedAssetId(asset.id);
      setPendingDeleteAssetId(null);
    } catch (err) {
      setError(errorMessage(err, "导入失败"));
    } finally {
      setImporting(false);
    }
  }

  async function importDroppedPath(event: React.DragEvent<HTMLDivElement>): Promise<void> {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files.item(0) as (File & { path?: string }) | null;
    const path = file?.path || event.dataTransfer.getData("text/plain");
    if (!path) {
      setError("无法读取拖入文件夹路径。请直接拖入文件夹，或使用“选择文件夹并导入”。");
      return;
    }
    await importPath(path);
  }

  async function removeSelectedAsset(): Promise<void> {
    if (!selectedAsset) return;
    if (selectedAsset.builtIn) {
      setError("系统默认素材包不能删除。");
      return;
    }
    if (frameAssets.length <= 1) {
      setError("至少需要保留一个素材包。");
      return;
    }
    if (selectedAssetUsers.length > 0) {
      setError(`该素材包正在被 ${selectedAssetUsers.map((item) => item.name).join("、")} 使用，请先给这些人物换一个素材包。`);
      return;
    }
    if (pendingDeleteAssetId !== selectedAsset.id) {
      setPendingDeleteAssetId(selectedAsset.id);
      setError(null);
      return;
    }

    setDeletingAsset(true);
    setError(null);
    try {
      await onDeleteFrameAsset(selectedAsset.id);
      setSelectedAssetId("rick_default");
      setPendingDeleteAssetId(null);
    } catch (err) {
      setError(errorMessage(err, "删除素材包失败"));
    } finally {
      setDeletingAsset(false);
    }
  }

  async function save(): Promise<void> {
    const trimmedName = name.trim();
    const trimmedPrompt = prompt.trim();
    if (!trimmedName) {
      setError("请输入人物名字");
      return;
    }
    if (trimmedName.length > 30) {
      setError("人物名字最多 30 个字符");
      return;
    }
    if (!trimmedPrompt) {
      setError("请输入人物 prompt");
      return;
    }
    if (trimmedPrompt.length > 1000) {
      setError("人物 prompt 最多 1000 个字符");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const frameSourcePath = selectedAsset?.id ?? "rick_default";
      if (mode === "edit" && editingId) {
        await onUpdateCharacter({ characterId: editingId, name: trimmedName, prompt: trimmedPrompt, frameSourcePath });
      } else {
        await onCreateCharacter({ name: trimmedName, prompt: trimmedPrompt, frameSourcePath });
      }
      resetCreateForm();
    } catch (err) {
      setError(errorMessage(err, "保存失败"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(profile: CharacterProfile): Promise<void> {
    if (pendingDeleteId !== profile.id) {
      setPendingDeleteId(profile.id);
      setError(null);
      return;
    }
    try {
      await onDeleteCharacter(profile.id);
      if (editingId === profile.id) resetCreateForm();
      setPendingDeleteId(null);
    } catch (err) {
      setError(errorMessage(err, "删除失败"));
    }
  }

  return (
    <PanelShell title="人物" subtitle={character ? `当前人物：${character.name}` : "新建和管理人物"} onClose={onClose}>
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain pr-1">
        <div className="flex min-h-full flex-col gap-3 pb-2">
          <div className="rounded-[8px] border border-sky-100 bg-white/72 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sky-700">
                <UserRoundPlus size={17} />
                <span className="text-[12px] font-semibold">{mode === "edit" ? "编辑人物" : "新建人物"}</span>
              </div>
              {mode === "edit" ? (
                <button className="text-[11px] font-semibold text-sky-600" type="button" onClick={resetCreateForm}>
                  新建
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600">
                人物名字
                <input
                  className="mt-1 h-9 w-full rounded-[8px] border border-sky-100 bg-white/84 px-3 text-[12px] outline-none focus:border-cyan-300"
                  value={name}
                  maxLength={30}
                  placeholder="最多 30 个字符"
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label className="block text-[11px] font-semibold text-slate-600">
                人物 prompt
                <textarea
                  className="mt-1 h-20 w-full resize-none rounded-[8px] border border-sky-100 bg-white/84 px-3 py-2 text-[12px] outline-none focus:border-cyan-300"
                  value={prompt}
                  maxLength={1000}
                  placeholder="描述人物性格、说话方式和行为边界"
                  onChange={(event) => setPrompt(event.target.value)}
                />
              </label>

              <label className="block text-[11px] font-semibold text-slate-600">
                PNG 序列帧资源
                <select
                  className="mt-1 h-9 w-full rounded-[8px] border border-sky-100 bg-white/84 px-3 text-[12px] outline-none focus:border-cyan-300"
                  value={selectedAssetId}
                  onChange={(event) => {
                    setSelectedAssetId(event.target.value);
                    setPendingDeleteAssetId(null);
                  }}
                >
                  {frameAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}{asset.builtIn ? "（系统自带）" : ""}{asset.shortActionKeys.length ? ` · ${asset.shortActionKeys.length} 个短动作` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div
                ref={dropZoneRef}
                className={`rounded-[8px] border border-dashed px-3 py-3 text-center text-[11px] transition ${
                  dragActive ? "border-sky-400 bg-sky-50 text-sky-700" : "border-sky-200 bg-white/62 text-slate-500"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event) => void importDroppedPath(event)}
              >
                <UploadCloud className="mx-auto mb-1" size={18} />
                拖入序列帧文件夹，或点击下方按钮选择下载好的文件夹
              </div>

              <button
                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] border border-sky-100 bg-white text-[12px] font-semibold text-sky-700 transition hover:bg-sky-50 disabled:text-slate-300"
                type="button"
                disabled={importing}
                onClick={() => void importFromFolderPicker()}
              >
                <FolderOpen size={14} />
                {importing ? "导入中..." : "选择文件夹并导入"}
              </button>

              {selectedAsset ? (
                <div className="space-y-2 rounded-[8px] bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-700">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    当前资源：{selectedAsset.name} · 短动作 {selectedAsset.shortActionKeys.length} 个
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="h-7 rounded-[8px] border border-rose-100 bg-white px-2 text-[11px] font-semibold text-rose-500 disabled:text-slate-300"
                      type="button"
                      disabled={!canDeleteSelectedAsset || deletingAsset}
                      title={
                        selectedAsset.builtIn
                          ? "系统默认素材包不能删除"
                          : selectedAssetUsers.length
                            ? "该素材包正在被人物使用"
                            : "完全删除该素材包文件夹"
                      }
                      onClick={() => void removeSelectedAsset()}
                    >
                      <Trash2 size={12} className="mr-1 inline" />
                      {deletingAsset ? "删除中..." : "删除素材包"}
                    </button>
                    {!canDeleteSelectedAsset ? (
                      <span className="text-[10px] text-slate-500">
                        {selectedAsset.builtIn
                          ? "系统素材保留"
                          : selectedAssetUsers.length
                            ? "被人物使用中"
                            : "至少保留一个素材"}
                      </span>
                    ) : null}
                  </div>
                  {pendingDeleteAssetId === selectedAsset.id ? (
                    <div className="rounded-[8px] border border-rose-100 bg-white px-2 py-2 text-rose-600">
                      <p>确认彻底删除「{selectedAsset.name}」素材包？会删除 public/assets/skins 下对应文件夹。</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          className="h-7 rounded-[8px] border border-rose-200 bg-rose-50 text-[11px] font-semibold text-rose-600"
                          type="button"
                          onClick={() => void removeSelectedAsset()}
                        >
                          确认删除
                        </button>
                        <button
                          className="h-7 rounded-[8px] border border-sky-100 bg-white text-[11px] font-semibold text-slate-500"
                          type="button"
                          onClick={() => setPendingDeleteAssetId(null)}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {error ? <div className="rounded-[8px] bg-rose-50 px-2 py-1.5 text-[11px] text-rose-600">{error}</div> : null}

              <button
                className="h-8 w-full rounded-[8px] bg-blue-500 text-[12px] font-semibold text-white transition hover:bg-blue-600 disabled:bg-slate-300"
                type="button"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? "保存中..." : mode === "edit" ? "保存修改" : "创建人物"}
              </button>
            </div>
          </div>

          <div className="rounded-[8px] border border-dashed border-sky-200 bg-white/58 p-3 text-[11px] leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-600">序列帧资源要求</p>
            <p className="mt-1">
              必须包含 calm、sleeping、wake_up、yawn、sit、sit_down、happy、cheer_up、sad、angry、comfort、thinking、eat_food、run_left、run_right、fly_up、fall_down、dizzy、error，以及工具箱按钮 box。
            </p>
            <p className="mt-1">
              直接拖入或选择角色资源文件夹即可，例如 rick_default。导入后会使用文件夹名作为资源目录名，只复制配置需要的 PNG 帧。
            </p>
            <p className="mt-1">
              还需要至少一个短动作目录，命名为 action1、action2、action3 等。每个 action 目录固定 6 张 PNG：action1_0001.png 到 action1_0006.png，超过 6 张会导入失败。
            </p>
            <p className="mt-1">
              其他动作按配置帧数放图：大多数为 6 张，run_left / run_right 为 4 张，sit_down 为 4 张，fall_down 为 4 张，dizzy 为 2 张，box 为 1 张 box_0001.png。所有 PNG 尺寸需一致，并带透明通道。
            </p>
          </div>

          <div className="space-y-2">
            {characters.map((profile) => (
              <div key={profile.id} className="rounded-[8px] border border-sky-100 bg-white/72 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold text-slate-800">
                      {profile.name}
                      {profile.isActive ? <span className="ml-2 text-[10px] text-emerald-600">当前</span> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                      {profile.prompt || profile.description || "暂无 prompt"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button className="h-7 rounded-[8px] border border-sky-100 bg-white px-2 text-[11px] font-semibold text-sky-700 disabled:text-slate-300" type="button" disabled={profile.isActive} onClick={() => void onSwitchCharacter(profile.id)}>
                      切换
                    </button>
                    <button className="grid h-7 w-7 place-items-center rounded-[8px] border border-sky-100 bg-white text-sky-700" type="button" title="编辑" onClick={() => editProfile(profile)}>
                      <Pencil size={13} />
                    </button>
                    <button className="grid h-7 w-7 place-items-center rounded-[8px] border border-rose-100 bg-white text-rose-500 disabled:text-slate-300" type="button" title="删除" disabled={characters.length <= 1} onClick={() => void remove(profile)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 rounded-[8px] border border-sky-100 bg-white/55 px-2 py-2">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">角色大小</span>
                    <span className="font-semibold text-sky-700">
                      {profile.isActive ? `${Math.round((profile.displayScale ?? 1) * 100)}%` : "切换后可调整"}
                    </span>
                  </div>
                  <input
                    className="h-2 w-full cursor-pointer accent-sky-500 disabled:cursor-not-allowed disabled:opacity-45"
                    type="range"
                    min={MIN_CHARACTER_SCALE}
                    max={MAX_CHARACTER_SCALE}
                    step={CHARACTER_SCALE_STEP}
                    value={profile.displayScale ?? 1}
                    disabled={!profile.isActive}
                    onChange={(event) => updateScale(profile, Number(event.target.value))}
                    onMouseUp={(event) => {
                      if (!profile.isActive) return;
                      const scale = Number((event.currentTarget as HTMLInputElement).value);
                      void onUpdateCharacterScale(profile.id, scale).catch((err) => {
                        setError(errorMessage(err, "角色大小保存失败"));
                      });
                    }}
                    onTouchEnd={(event) => {
                      if (!profile.isActive) return;
                      const scale = Number((event.currentTarget as HTMLInputElement).value);
                      void onUpdateCharacterScale(profile.id, scale).catch((err) => {
                        setError(errorMessage(err, "角色大小保存失败"));
                      });
                    }}
                  />
                </div>
                {pendingDeleteId === profile.id ? (
                  <div className="mt-2 rounded-[8px] border border-rose-100 bg-rose-50 px-2 py-2">
                    <p className="text-[11px] leading-relaxed text-rose-600">
                      确认删除「{profile.name}」？聊天记录和记忆也会一起删除。
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        className="h-7 rounded-[8px] border border-rose-200 bg-white text-[11px] font-semibold text-rose-600"
                        type="button"
                        onClick={() => void remove(profile)}
                      >
                        确认删除
                      </button>
                      <button
                        className="h-7 rounded-[8px] border border-sky-100 bg-white text-[11px] font-semibold text-slate-500"
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
