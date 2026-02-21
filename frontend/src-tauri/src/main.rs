use std::fs::OpenOptions;
use std::io::Write;

/// Write startup diagnostics to %TEMP%\pulselogic.log
fn startup_log(msg: &str) {
    let temp = std::env::var("TEMP")
        .or_else(|_| std::env::var("TMP"))
        .unwrap_or_else(|_| "C:\\Temp".to_string());
    let path = format!("{}\\pulselogic.log", temp);
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&path) {
        let _ = writeln!(f, "{}", msg);
    }
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

fn main() {
    startup_log("=== PulseLogic v1.0.0 starting ===");

    let result = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![get_app_version])
        .setup(|_app| {
            startup_log("Setup complete — window is now visible");
            Ok(())
        })
        .run(tauri::generate_context!());

    match result {
        Ok(_) => startup_log("Application exited normally"),
        Err(e) => {
            let msg = format!("FATAL ERROR: {}", e);
            startup_log(&msg);
            eprintln!("{}", msg);
        }
    }
}
