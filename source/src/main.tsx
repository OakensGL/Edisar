import { createRoot } from "react-dom/client";
import App from "./game.canvas";

// Standalone-only: also autosave when the tab is hidden or closed. The build patches the
// game's GameScreen effect to register its own autosave() here.
(globalThis as any).__edisarHookSave = (save: () => void): (() => void) => {
  const onHide = (): void => { if (document.visibilityState === "hidden") save(); };
  window.addEventListener("beforeunload", save);
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", onHide);
  return () => { window.removeEventListener("beforeunload", save); window.removeEventListener("pagehide", save); document.removeEventListener("visibilitychange", onHide); };
};

createRoot(document.getElementById("root")!).render(<App />);
