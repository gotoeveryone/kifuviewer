use crate::sgf::parser::parse_sgf_collection;
use crate::sgf::types::SgfCollection;
use chardetng::EncodingDetector;
use encoding_rs::UTF_8;
use filetime::{set_file_mtime, FileTime};
use rfd::FileDialog;
use std::fs;
use std::sync::{Mutex, OnceLock};
use std::time::SystemTime;

static PENDING_OPEN_PATH: OnceLock<Mutex<Option<String>>> = OnceLock::new();

fn pending_open_path_cell() -> &'static Mutex<Option<String>> {
    PENDING_OPEN_PATH.get_or_init(|| Mutex::new(None))
}

pub fn set_pending_open_path(path: Option<String>) {
    if let Ok(mut pending) = pending_open_path_cell().lock() {
        *pending = path;
    }
}

#[tauri::command]
pub fn pick_sgf_file() -> Result<Option<String>, String> {
    let file = FileDialog::new()
        .add_filter("SGF", &["sgf"])
        .set_title("Open SGF file")
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn pick_save_sgf_file(
    default_file_name: Option<String>,
    default_directory: Option<String>,
) -> Result<Option<String>, String> {
    let file_name = default_file_name
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| "game.sgf".to_string());
    let mut dialog = FileDialog::new()
        .add_filter("SGF", &["sgf"])
        .set_title("Save SGF file")
        .set_file_name(&file_name);
    if let Some(dir) = default_directory.filter(|dir| !dir.trim().is_empty()) {
        dialog = dialog.set_directory(dir);
    }
    let file = dialog.save_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn open_sgf_file(path: String) -> Result<SgfCollection, String> {
    let bytes = fs::read(&path).map_err(|e| format!("failed to read file: {e}"))?;
    let content = decode_sgf_bytes(&bytes);
    parse_sgf_collection(&content).map_err(|e| e.to_string())
}

fn decode_sgf_bytes(bytes: &[u8]) -> String {
    if let Ok(utf8) = std::str::from_utf8(bytes) {
        return utf8.strip_prefix('\u{feff}').unwrap_or(utf8).to_string();
    }

    let mut detector = EncodingDetector::new();
    detector.feed(bytes, true);
    let encoding = detector.guess(None, true);
    let (decoded, _, _) = encoding.decode(bytes);

    if encoding == UTF_8 {
        decoded.strip_prefix('\u{feff}').unwrap_or(&decoded).to_string()
    } else {
        decoded.into_owned()
    }
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

#[tauri::command]
pub fn take_pending_open_path() -> Option<String> {
    if let Ok(mut pending) = pending_open_path_cell().lock() {
        return pending.take();
    }
    None
}

#[cfg(test)]
mod tests {
    use super::decode_sgf_bytes;

    #[test]
    fn decode_sgf_bytes_supports_utf8_bom() {
        let bytes = b"\xEF\xBB\xBF(;GM[1]FF[4]SZ[19])";
        let decoded = decode_sgf_bytes(bytes);
        assert_eq!(decoded, "(;GM[1]FF[4]SZ[19])");
    }

    #[test]
    fn decode_sgf_bytes_recovers_invalid_utf8() {
        let bytes = b"(;GM[1]FF[4]C[abc\xFFdef])";
        let decoded = decode_sgf_bytes(bytes);
        assert!(decoded.starts_with("(;GM[1]FF[4]C["));
        assert!(decoded.contains("abc"));
        assert!(decoded.contains("def"));
    }
}
