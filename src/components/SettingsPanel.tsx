import { CheckCircle2, Eye, EyeOff, FolderOpen, Loader2, RotateCcw, Save, TestTube, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AI_PROVIDER_PRESETS, findAiProviderPreset } from "../config/aiProviders";
import type { AiProviderConfig, AppSettings, DataPaths, SaveAiProviderRequest } from "../types/domain";
import {
  deleteAiProviderApiKey,
  deleteAiProviderConfig,
  getAiConfigPublic,
  saveAiProviderConfig,
  setActiveAiProvider,
  testAiConnection,
} from "../storage/database/tauriClient";
import { PanelShell } from "./PanelShell";

interface SettingsPanelProps {
  settings: AppSettings | null;
  dataPaths: DataPaths | null;
  onSave: (settings: AppSettings) => Promise<void>;
  onResetStats: () => Promise<void>;
  onOpenDataDir: () => Promise<string>;
  onClose: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function SettingsPanel({ settings, dataPaths, onSave, onResetStats, onOpenDataDir, onClose }: SettingsPanelProps) {
  const [draft, setDraft] = useState<AppSettings | null>(settings);
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState(AI_PROVIDER_PRESETS[0].providerId);
  const [providerId, setProviderId] = useState(AI_PROVIDER_PRESETS[0].providerId);
  const [displayName, setDisplayName] = useState(AI_PROVIDER_PRESETS[0].displayName);
  const [providerType, setProviderType] = useState(AI_PROVIDER_PRESETS[0].protocol);
  const [baseUrl, setBaseUrl] = useState(AI_PROVIDER_PRESETS[0].baseUrl);
  const [model, setModel] = useState(AI_PROVIDER_PRESETS[0].defaultModel);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const selectedPreset = useMemo(() => findAiProviderPreset(selectedPresetId), [selectedPresetId]);
  const savedProvider = providers.find((provider) => provider.providerId === providerId);
  const apiKeyRequired = selectedPreset?.requiresApiKey ?? providerType !== "ollama";

  useEffect(() => setDraft(settings), [settings]);

  useEffect(() => {
    void refreshProviders();
  }, []);

  async function refreshProviders(): Promise<void> {
    try {
      setProviders(await getAiConfigPublic());
    } catch (error) {
      setStatus(getErrorMessage(error, "读取 AI 配置失败"));
    }
  }

  function applyPreset(presetId: string): void {
    const preset = findAiProviderPreset(presetId);
    if (!preset) return;
    setSelectedPresetId(preset.providerId);
    setProviderId(preset.providerId);
    setDisplayName(preset.displayName);
    setProviderType(preset.protocol);
    setBaseUrl(preset.baseUrl);
    setModel(preset.defaultModel);
    setApiKey("");
    setStatus(null);
  }

  function loadExistingProvider(config: AiProviderConfig): void {
    const preset = findAiProviderPreset(config.providerId);
    setSelectedPresetId(preset?.providerId ?? config.providerId);
    setProviderId(config.providerId);
    setDisplayName(config.displayName);
    setProviderType(config.providerType as typeof providerType);
    setBaseUrl(config.baseUrl);
    setModel(config.model);
    setApiKey("");
    setStatus(null);
  }

  async function saveProvider(makeActive = true): Promise<AiProviderConfig | null> {
    if (!providerId || !displayName || !baseUrl || !model) {
      setStatus("请先选择厂商并填写模型。");
      return null;
    }

    if (apiKeyRequired && !apiKey.trim() && !savedProvider?.hasApiKey) {
      setStatus("请先输入 API Key。");
      return null;
    }

    setSaving(true);
    setStatus(null);
    try {
      const request: SaveAiProviderRequest = {
        providerId,
        providerType,
        displayName,
        baseUrl,
        model,
        stream: true,
        temperature: 0.8,
        maxOutputTokens: 1200,
        timeoutMs: 60000,
      };

      if (apiKey.trim()) {
        request.apiKey = apiKey.trim();
      }

      const saved = await saveAiProviderConfig(request);
      if (makeActive) {
        await setActiveAiProvider(providerId);
      }
      setApiKey("");
      await refreshProviders();
      setStatus(makeActive ? `${displayName} 已保存并设为聊天模型。` : `${displayName} 已保存。`);
      return saved;
    } catch (error) {
      setStatus(getErrorMessage(error, "保存 AI 配置失败"));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(): Promise<void> {
    setTesting(true);
    setStatus(null);
    try {
      const saved = await saveProvider(true);
      if (!saved) return;
      const result = await testAiConnection(providerId);
      setStatus(result || "连接测试通过。");
    } catch (error) {
      setStatus(getErrorMessage(error, "连接测试失败"));
    } finally {
      setTesting(false);
    }
  }

  async function handleDeleteKey(): Promise<void> {
    if (!providerId) return;
    try {
      await deleteAiProviderApiKey(providerId);
      await refreshProviders();
      setStatus("API Key 已删除。");
    } catch (error) {
      setStatus(getErrorMessage(error, "删除 API Key 失败"));
    }
  }

  async function handleDeleteProvider(provider: AiProviderConfig): Promise<void> {
    try {
      await deleteAiProviderConfig(provider.providerId);
      await refreshProviders();
      if (provider.providerId === providerId) {
        applyPreset(AI_PROVIDER_PRESETS[0].providerId);
      }
    } catch (error) {
      setStatus(getErrorMessage(error, "删除 AI 配置失败"));
    }
  }

  if (!draft) {
    return (
      <PanelShell title="设置" onClose={onClose}>
        加载中...
      </PanelShell>
    );
  }

  return (
    <PanelShell title="设置" subtitle="AI 模型与系统偏好" onClose={onClose}>
      <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
        <div className="rounded-[8px] border border-sky-100 bg-white/72 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-slate-700">AI 聊天模型</span>
            {savedProvider?.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                <CheckCircle2 size={11} />
                当前使用
              </span>
            ) : null}
          </div>

          <label className="mt-2 block text-[11px] font-semibold text-slate-500">
            厂商
            <select
              className="mt-1 h-9 w-full rounded-[8px] border border-sky-100 bg-white/84 px-3 text-[12px] text-slate-700 outline-none focus:border-cyan-300"
              value={selectedPresetId}
              onChange={(event) => applyPreset(event.target.value)}
            >
              {AI_PROVIDER_PRESETS.map((preset) => (
                <option key={preset.providerId} value={preset.providerId}>
                  {preset.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-2 block text-[11px] font-semibold text-slate-500">
            API Key{apiKeyRequired ? "" : "（Ollama 可留空）"}
            {savedProvider?.hasApiKey ? <span className="ml-2 text-emerald-600">已保存，留空则不修改</span> : null}
            <div className="mt-1 flex gap-2">
              <input
                className="h-9 min-w-0 flex-1 rounded-[8px] border border-sky-100 bg-white/84 px-3 text-[12px] text-slate-700 outline-none focus:border-cyan-300"
                type={showKey ? "text" : "password"}
                value={apiKey}
                placeholder={apiKeyRequired ? "输入 API Key" : "本地 Ollama 不需要 API Key"}
                autoComplete="off"
                onChange={(event) => setApiKey(event.target.value)}
              />
              <button
                className="grid h-9 w-9 place-items-center rounded-[8px] border border-sky-100 bg-white/80 text-sky-700"
                type="button"
                title={showKey ? "隐藏" : "显示"}
                onClick={() => setShowKey((value) => !value)}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <label className="mt-2 block text-[11px] font-semibold text-slate-500">
            模型
            <input
              className="mt-1 h-9 w-full rounded-[8px] border border-sky-100 bg-white/84 px-3 text-[12px] text-slate-700 outline-none focus:border-cyan-300"
              list="ai-model-options"
              value={model}
              placeholder="选择或手动输入模型名"
              onChange={(event) => setModel(event.target.value)}
            />
            <datalist id="ai-model-options">
              {(selectedPreset?.models ?? []).map((modelName) => (
                <option key={modelName} value={modelName} />
              ))}
            </datalist>
          </label>

          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] font-semibold text-sky-700">高级配置</summary>
            <label className="mt-2 block text-[11px] font-semibold text-slate-500">
              Base URL
              <input
                className="mt-1 h-9 w-full rounded-[8px] border border-sky-100 bg-white/84 px-3 text-[12px] text-slate-700 outline-none focus:border-cyan-300"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
              />
            </label>
          </details>

          {status ? (
            <div className="mt-2 rounded-[8px] border border-sky-100 bg-white/72 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
              <div className="mb-1 font-semibold text-sky-700">状态 / 调试信息（不包含 API Key）</div>
              <pre className="whitespace-pre-wrap break-all font-sans">{status}</pre>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              className="flex h-8 items-center justify-center gap-1 rounded-[8px] bg-blue-500 text-[11px] font-semibold text-white disabled:opacity-50"
              type="button"
              disabled={saving || testing}
              onClick={() => void saveProvider(true)}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              保存使用
            </button>
            <button
              className="flex h-8 items-center justify-center gap-1 rounded-[8px] border border-sky-100 bg-white text-[11px] text-sky-700 disabled:opacity-50"
              type="button"
              disabled={saving || testing}
              onClick={() => void handleTest()}
            >
              {testing ? <Loader2 size={13} className="animate-spin" /> : <TestTube size={13} />}
              测试
            </button>
            <button
              className="flex h-8 items-center justify-center gap-1 rounded-[8px] border border-rose-100 bg-rose-50 text-[11px] text-rose-600 disabled:opacity-50"
              type="button"
              disabled={!savedProvider?.hasApiKey}
              onClick={() => void handleDeleteKey()}
            >
              <Trash2 size={13} />
              删 Key
            </button>
          </div>
        </div>

        {providers.length > 0 ? (
          <div className="rounded-[8px] border border-sky-100 bg-white/72 p-3">
            <span className="text-[12px] font-semibold text-slate-700">已保存配置</span>
            <div className="mt-2 space-y-1.5">
              {providers.map((provider) => (
                <div key={provider.providerId} className="flex items-center gap-2">
                  <button
                    className={`min-w-0 flex-1 rounded-[8px] border px-2 py-1.5 text-left text-[11px] transition ${
                      provider.isActive
                        ? "border-cyan-300 bg-cyan-50 text-sky-800"
                        : "border-sky-100 bg-white/80 text-slate-600 hover:border-cyan-200"
                    }`}
                    type="button"
                    onClick={() => loadExistingProvider(provider)}
                    title={provider.model}
                  >
                    <span className="block truncate font-semibold">{provider.displayName}</span>
                    <span className="block truncate text-[10px] opacity-75">{provider.model}</span>
                  </button>
                  <button
                    className="grid h-8 w-8 place-items-center rounded-[8px] border border-sky-100 bg-white text-sky-700"
                    type="button"
                    title="设为当前聊天模型"
                    onClick={() => {
                      void setActiveAiProvider(provider.providerId).then(refreshProviders);
                    }}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button
                    className="grid h-8 w-8 place-items-center rounded-[8px] border border-rose-100 bg-rose-50 text-rose-600"
                    type="button"
                    title="删除配置"
                    onClick={() => void handleDeleteProvider(provider)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-[8px] border border-sky-100 bg-white/72 p-3 text-[11px] leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-700">隐私与数据</p>
          <p className="mt-1 break-all">{dataPaths?.root ?? "appDataDir/bytepet-data"}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button className="flex h-8 items-center justify-center gap-1 rounded-[8px] border border-sky-100 bg-white text-sky-700" type="button" onClick={() => void onOpenDataDir()}>
              <FolderOpen size={14} />
              打开
            </button>
            <button className="flex h-8 items-center justify-center gap-1 rounded-[8px] border border-rose-100 bg-rose-50 text-rose-600" type="button" onClick={() => void onResetStats()}>
              <RotateCcw size={14} />
              作弊重置
            </button>
          </div>
        </div>

        <button className="flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-blue-500 text-[12px] font-semibold text-white hover:bg-blue-600" type="button" onClick={() => void onSave({ ...draft, autoStart: false })}>
          <Save size={14} />
          保存设置
        </button>
      </div>
    </PanelShell>
  );
}
