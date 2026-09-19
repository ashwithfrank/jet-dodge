import { DEFAULT_PREFS, PREFS_VERSION, type Prefs } from "./types";

const KEY = "jet-dodge:save:v1";
const BACKUP_KEY = "jet-dodge:save:backup";

function migrate(raw: Partial<Prefs> & { version?: number }): Prefs {
  const next: Prefs = { ...DEFAULT_PREFS, ...raw, version: PREFS_VERSION };
  if (typeof next.highScore !== "number" || !Number.isFinite(next.highScore)) {
    next.highScore = 0;
  }
  next.highScore = Math.max(0, Math.floor(next.highScore));
  next.muted = Boolean(next.muted);
  next.sfx = next.sfx !== false;
  next.music = next.music !== false;
  next.reducedFx = Boolean(next.reducedFx);
  return next;
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return migrate(parsed);
  } catch {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) return migrate(JSON.parse(backup) as Partial<Prefs>);
    } catch {
      /* ignore */
    }
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  const payload = JSON.stringify({ ...prefs, version: PREFS_VERSION });
  try {
    const previous = localStorage.getItem(KEY);
    if (previous) localStorage.setItem(BACKUP_KEY, previous);
    localStorage.setItem(KEY, payload);
  } catch {
    /* private mode / quota — keep in-memory prefs */
  }
}
