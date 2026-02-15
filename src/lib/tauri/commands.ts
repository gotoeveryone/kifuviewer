import { invoke } from "@tauri-apps/api/core";
import type { SgfCollection } from "../types/sgf";

export const pickSgfFile = async (): Promise<string | null> => {
  return invoke<string | null>("pick_sgf_file");
};

export const pickSaveSgfFile = async (): Promise<string | null> => {
  return invoke<string | null>("pick_save_sgf_file");
};

export const openSgfFile = async (path: string): Promise<SgfCollection> => {
  return invoke<SgfCollection>("open_sgf_file", { path });
};

export const saveSgfTextFile = async (path: string, content: string): Promise<void> => {
  await invoke("save_sgf_text_file", { path, content });
};
