// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn log(name: &str) -> () {
    println!("{}", name);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_svelte::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        // .plugin(tauri_plugin_websocket::init())
        .invoke_handler(tauri::generate_handler![log])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
