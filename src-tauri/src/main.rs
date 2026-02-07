#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            go_kifu_viewer_lib::commands::open_sgf_file,
            go_kifu_viewer_lib::commands::save_sgf_file,
            go_kifu_viewer_lib::commands::validate_sgf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
