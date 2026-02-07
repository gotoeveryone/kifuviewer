use crate::sgf::parser::parse_sgf_collection;
use crate::sgf::serializer::serialize_sgf_collection;
use crate::sgf::types::SgfCollection;
use std::fs;

#[tauri::command]
pub fn open_sgf_file(path: String) -> Result<SgfCollection, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("failed to read file: {e}"))?;
    parse_sgf_collection(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_sgf_file(path: String, sgf: SgfCollection) -> Result<(), String> {
    let content = serialize_sgf_collection(&sgf);
    fs::write(&path, content).map_err(|e| format!("failed to write file: {e}"))
}

#[tauri::command]
pub fn validate_sgf(sgf: SgfCollection) -> Result<(), String> {
    if sgf.games.is_empty() {
        return Err("SGF collection contains no games".to_string());
    }
    Ok(())
}
