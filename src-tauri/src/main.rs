#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::Path;
use tauri::{Emitter, Manager, RunEvent};

fn is_sgf_path(path: &str) -> bool {
    Path::new(path)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("sgf"))
        .unwrap_or(false)
}

fn find_sgf_path_in_args(args: &[String]) -> Option<String> {
    args.iter()
        .skip(1)
        .find(|arg| is_sgf_path(arg))
        .cloned()
}

fn emit_file_open_request(app_handle: &tauri::AppHandle, path: &str) {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.emit("file-open-request", path.to_string());
    }
}

fn set_pending_and_emit(app_handle: &tauri::AppHandle, path: String) {
    go_kifu_viewer_lib::commands::set_pending_open_path(Some(path.clone()));
    emit_file_open_request(app_handle, &path);
}

fn main() {
    let app = tauri::Builder::default()
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            let pending_path = find_sgf_path_in_args(&args);
            if let Some(path) = pending_path {
                set_pending_and_emit(&app.handle().clone(), path);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            go_kifu_viewer_lib::commands::pick_sgf_file,
            go_kifu_viewer_lib::commands::pick_save_sgf_file,
            go_kifu_viewer_lib::commands::open_sgf_file,
            go_kifu_viewer_lib::commands::save_sgf_text_file,
            go_kifu_viewer_lib::commands::validate_sgf,
            go_kifu_viewer_lib::commands::take_pending_open_path,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        #[cfg(target_os = "macos")]
        if let RunEvent::Opened { urls } = event {
            let path = urls.into_iter().find_map(|url| {
                let file_path = url.to_file_path().ok()?;
                let path_str = file_path.to_string_lossy().to_string();
                if is_sgf_path(&path_str) {
                    Some(path_str)
                } else {
                    None
                }
            });

            if let Some(path) = path {
                set_pending_and_emit(app_handle, path);
            }
        }
    });
}
