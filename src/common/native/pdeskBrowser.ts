import { registerPlugin } from "@capacitor/core";

export interface PdeskBrowserPlugin {
  openExternal(options: { url: string }): Promise<{ opened: boolean }>;
}

export const PdeskBrowser = registerPlugin<PdeskBrowserPlugin>("PdeskBrowser");
