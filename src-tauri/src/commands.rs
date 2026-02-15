use crate::sgf::parser::parse_sgf_collection;
use crate::sgf::types::SgfCollection;
use filetime::{set_file_mtime, FileTime};
use rfd::FileDialog;
use std::fs;
use std::time::SystemTime;

#[tauri::command]
pub fn pick_sgf_file() -> Result<Option<String>, String> {
    let file = FileDialog::new()
        .add_filter("SGF", &["sgf"])
        .set_title("Open SGF file")
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn pick_save_sgf_file() -> Result<Option<String>, String> {
    let file = FileDialog::new()
        .add_filter("SGF", &["sgf"])
        .set_title("Save SGF file")
        .set_file_name("game.sgf")
        .save_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn open_sgf_file(path: String) -> Result<SgfCollection, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("failed to read file: {e}"))?;
    parse_sgf_collection(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_sgf_text_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("failed to write file: {e}"))?;

    set_file_mtime(&path, FileTime::from_system_time(SystemTime::now()))
        .map_err(|e| format!("failed to set mtime: {e}"))
}

#[tauri::command]
pub fn validate_sgf(sgf: SgfCollection) -> Result<(), String> {
    if sgf.games.is_empty() {
        return Err("SGF collection contains no games".to_string());
    }
    Ok(())
}
