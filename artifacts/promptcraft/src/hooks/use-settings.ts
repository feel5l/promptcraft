import { useState, useEffect } from "react";

export interface Settings {
  provider: string;
  model: string;
  apiKey: string;
}

const DEFAULT_SETTINGS: Settings = {
  provider: "",
  model: "",
  apiKey: "",
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("promptcraft_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("promptcraft_settings", JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
}
