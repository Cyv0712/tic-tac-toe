// Kept apart from settings.ts so the server layout can import it without
// pulling in the client-only settings hook.

export const STORAGE_KEY = "neon-ttt:v1";

/** Inline script run before first paint so the saved theme never flashes. */
export const THEME_BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}");var t=s&&s.theme;if(t==="neon"||t==="notebook"||t==="pets")document.documentElement.dataset.theme=t}catch(e){}`;
