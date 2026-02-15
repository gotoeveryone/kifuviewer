#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            if let Some(path) = args.get(1).filter(|p| p.to_lowercase().ends_with(".sgf")) {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("file-open-request", path.clone());
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            go_kifu_viewer_lib::commands::pick_sgf_file,
            go_kifu_viewer_lib::commands::pick_save_sgf_file,
            go_kifu_viewer_lib::commands::open_sgf_file,
            go_kifu_viewer_lib::commands::save_sgf_text_file,
            go_kifu_viewer_lib::commands::validate_sgf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
