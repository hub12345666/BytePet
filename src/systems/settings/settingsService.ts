import type { AppSettings } from "../../types/domain";

export function redactSecret(value: string): string {
  if (!value) {
    return "";
  }

  if (value.length <= 8) {
    return "••••••••";
  }

  return `${value.slice(0, 3)}••••${value.slice(-4)}`;
}

export function normalizeSettings(settings: Partial<AppSettings>): AppSettings {
  return {
    apiKey: settings.apiKey ?? "",
    provider: settings.provider ?? "openai_compatible",
    modelName: settings.modelName ?? "gpt-4o",
    autoStart: false,
    soundEnabled: settings.soundEnabled ?? true,
    ttsEnabled: settings.ttsEnabled ?? false,
    volume: settings.volume ?? 50,
    notificationPrefs: settings.notificationPrefs ?? {
      foodDrops: true,
      errors: true,
      reminders: false
    },
    privacyLock: settings.privacyLock ?? false
  };
}
