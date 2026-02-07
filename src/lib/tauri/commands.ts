import { invoke } from "@tauri-apps/api/core";
import type { SgfCollection } from "../types/sgf";

export const openSgfFile = async (path: string): Promise<SgfCollection> => {
  return invoke<SgfCollection>("open_sgf_file", { path });
};

export const saveSgfFile = async (path: string, sgf: SgfCollection): Promise<void> => {
  await invoke("save_sgf_file", { path, sgf });
};

export const validateSgf = async (sgf: SgfCollection): Promise<void> => {
  await invoke("validate_sgf", { sgf });
};
