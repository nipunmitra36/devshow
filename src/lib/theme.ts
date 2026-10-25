export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "devshow-theme";
export const THEME_COLOR: Record<Theme, string> = { light: "#f6f8fa", dark: "#050607" };

/**
 * Runs in <head> before first paint so a saved theme never flashes.
 * Night is the default; day is applied only when the visitor chose it.
 */
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m&&t==="light")m.setAttribute("content","${THEME_COLOR.light}")}}catch(e){}`;
