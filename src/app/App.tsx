import { useCallback, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BoxButton } from "../components/BoxButton";
import { ChatPanel } from "../components/ChatPanel";
import { FeedPanel } from "../components/FeedPanel";
import { MemoryPanel } from "../components/MemoryPanel";
import { PetSprite } from "../components/PetSprite";
import { SettingsPanel } from "../components/SettingsPanel";
import { SkinPanel } from "../components/SkinPanel";
import { StatsPanel } from "../components/StatsPanel";
import { ThemePanel } from "../components/ThemePanel";
import { ToolboxPopover } from "../components/ToolboxPopover";
import { useClickThrough } from "../hooks/useClickThrough";
import { useAppStore } from "../stores/useAppStore";
import { applyTheme, readActiveTheme } from "../theme/theme";

export function App() {
  useClickThrough();

  const {
    activePanel,
    bootstrap,
    character,
    characters,
    closePanel,
    createCharacter,
    currentState,
    dataPaths,
    deleteChatSession,
    deleteChatHistoryDay,
    deleteCharacter,
    deleteFrameAsset,
    endDrag,
    feed,
    foods,
    frameAssets,
    loading,
    messages,
    openDataDir,
    openPanel,
    replaceFood,
    resetStats,
    saveSettings,
    sessions,
    settings,
    startDrag,
    stats,
    tickAnimation,
    tickMovement,
    updateDrag,
    updatePhysics,
    switchCharacter,
    updateCharacter,
    previewCharacterScale,
    updateCharacterScale,
    chooseAndImportFrameAsset,
    importFrameAssetFromPath,
    body,
    boxOpen,
    toolboxVisible,
    showToolbox,
    lullToSleep,
  } = useAppStore();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    applyTheme(readActiveTheme());
  }, []);

  useEffect(() => {
    if (!window.__TAURI_INTERNALS__) return;

    const appWindow = getCurrentWindow();
    let disposed = false;
    let unlisten: (() => void) | null = null;

    void appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        void appWindow.setSkipTaskbar(true);
      }
    }).then((handler) => {
      if (disposed) {
        handler();
      } else {
        unlisten = handler;
      }
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  // Listen for system tray events
  useEffect(() => {
    if (!window.__TAURI_INTERNALS__) return;

    const unlisten = listen("tray-show-toolbox", () => {
      showToolbox();
    });
    const unlistenSleep = listen("tray-lull-to-sleep", () => {
      lullToSleep();
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenSleep.then((fn) => fn());
    };
  }, [lullToSleep, showToolbox]);

  useEffect(() => {
    const timer = window.setInterval(tickAnimation, 250);
    return () => window.clearInterval(timer);
  }, [tickAnimation]);

  const updatePhysicsRef = useRef(updatePhysics);
  updatePhysicsRef.current = updatePhysics;

  useEffect(() => {
    let lastTime = performance.now();
    let animFrameId: number;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      updatePhysicsRef.current(dt);
      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(tickMovement, 111);
    return () => window.clearInterval(timer);
  }, [tickMovement]);

  const handleDragStart = useCallback((offsetX: number, offsetY: number) => {
    startDrag(offsetX, offsetY);
  }, [startDrag]);

  const handleDrag = useCallback((x: number, y: number) => {
    updateDrag(x, y);
  }, [updateDrag]);

  const handleDragEnd = useCallback((velocityX: number, velocityY: number) => {
    endDrag(velocityX, velocityY);
  }, [endDrag]);

  return (
    <main className="pointer-events-none relative h-screen w-screen overflow-hidden bg-transparent text-slate-800">
      <PetSprite
        currentState={currentState}
        skinId={character?.skinId ?? "rick_default"}
        frameAssetsPath={character?.frameAssetsPath ?? null}
        displayScale={character?.displayScale ?? 1}
        position={{ x: body.x, y: body.y }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      />

      {toolboxVisible ? <BoxButton /> : null}

      {toolboxVisible && boxOpen && !activePanel ? <ToolboxPopover activePanel={activePanel} onAction={openPanel} /> : null}

      {loading ? (
        <div
          className="glass-panel no-drag pointer-events-auto absolute right-4 top-[200px] rounded-[8px] px-3 py-2 text-[12px] font-semibold text-sky-800"
          data-interactive="true"
        >
          初始化本地数据...
        </div>
      ) : null}

      {activePanel === "stats" ? <StatsPanel stats={stats} characterName={character?.name} onClose={closePanel} /> : null}
      {activePanel === "chat" ? <ChatPanel character={character} messages={messages} onClose={closePanel} /> : null}
      {activePanel === "feed" ? (
        <FeedPanel
          foods={foods}
          stats={stats}
          onFeed={feed}
          onReplaceFood={replaceFood}
          onClose={closePanel}
        />
      ) : null}
      {activePanel === "skin" ? (
        <SkinPanel
          character={character}
          characters={characters}
          frameAssets={frameAssets}
          onChooseAndImportFrameAsset={chooseAndImportFrameAsset}
          onImportFrameAssetFromPath={importFrameAssetFromPath}
          onDeleteFrameAsset={deleteFrameAsset}
          onCreateCharacter={createCharacter}
          onSwitchCharacter={switchCharacter}
          onUpdateCharacter={updateCharacter}
          onPreviewCharacterScale={previewCharacterScale}
          onUpdateCharacterScale={updateCharacterScale}
          onDeleteCharacter={deleteCharacter}
          onClose={closePanel}
        />
      ) : null}
      {activePanel === "settings" ? (
        <SettingsPanel
          settings={settings}
          dataPaths={dataPaths}
          onSave={saveSettings}
          onResetStats={resetStats}
          onOpenDataDir={openDataDir}
          onClose={closePanel}
        />
      ) : null}
      {activePanel === "theme" ? <ThemePanel onClose={closePanel} /> : null}
      {activePanel === "memory" ? (
        <MemoryPanel
          character={character}
          characters={characters}
          sessions={sessions}
          messages={messages}
          onDeleteSession={deleteChatSession}
          onDeleteHistoryDay={deleteChatHistoryDay}
          onSwitchCharacter={switchCharacter}
          onManageCharacters={() => openPanel("skin")}
          onClose={closePanel}
        />
      ) : null}
    </main>
  );
}
