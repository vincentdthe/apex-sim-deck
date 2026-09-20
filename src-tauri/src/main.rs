// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use std::time::Duration;
use tauri::{CustomMenuItem, Manager, Menu, MenuItem, Submenu, Window};

const CURRENT_VERSION: &str = "1.0.1";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompanionApp {
    pub name: String,
    #[serde(rename = "exePath")]
    pub exe_path: Option<String>,
    pub args: Option<String>,
    pub delay: Option<u64>,
    #[serde(rename = "autoKill")]
    pub auto_kill: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchPayload {
    #[serde(rename = "profileName")]
    pub profile_name: String,
    #[serde(rename = "gameName")]
    pub game_name: String,
    #[serde(rename = "gameExe")]
    pub game_exe: Option<String>,
    #[serde(rename = "gameArgs")]
    pub game_args: Option<String>,
    #[serde(rename = "companionApps")]
    pub companion_apps: Vec<CompanionApp>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StatusUpdate {
    #[serde(rename = "stepIndex")]
    pub step_index: usize,
    pub status: String, // "pending" | "running" | "already_running" | "completed" | "error"
    pub message: String,
    pub pid: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateResponse {
    pub success: bool,
    #[serde(rename = "currentVersion")]
    pub current_version: String,
    #[serde(rename = "latestVersion")]
    pub latest_version: String,
    #[serde(rename = "updateAvailable")]
    pub update_available: bool,
    #[serde(rename = "releaseNotes")]
    pub release_notes: String,
    #[serde(rename = "downloadUrl")]
    pub download_url: String,
    #[serde(rename = "releaseUrl")]
    pub release_url: String,
}

// Check if a process is already running on Windows (Exact process name match)
#[tauri::command]
fn check_running(exe_path: String) -> bool {
    if exe_path.trim().is_empty() {
        return false;
    }
    let path_obj = Path::new(&exe_path);
    let file_name = match path_obj.file_name() {
        Some(name) => name.to_string_lossy().to_lowercase(),
        None => return false,
    };
    let truncated_name: String = file_name.chars().take(25).collect();

    let output = Command::new("tasklist")
        .args(["/FO", "CSV", "/NH"])
        .output();

    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        for line in stdout.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('"') {
                if let Some(end_quote) = trimmed[1..].find('"') {
                    let running_image = trimmed[1..=end_quote].to_lowercase();
                    if running_image == file_name || running_image == truncated_name {
                        return true;
                    }
                }
            }
        }
        false
    } else {
        false
    }
}

// Native File Pickers
#[tauri::command]
async fn select_exe_dialog() -> Option<String> {
    tokio::task::spawn_blocking(|| {
        tauri::api::dialog::blocking::FileDialogBuilder::new()
            .set_title("Select Executable or Script File")
            .add_filter("Executables & Scripts (*.exe, *.ps1, *.bat, *.cmd)", &["exe", "ps1", "bat", "cmd"])
            .add_filter("PowerShell Scripts (*.ps1)", &["ps1"])
            .add_filter("Batch Files (*.bat, *.cmd)", &["bat", "cmd"])
            .add_filter("All Files", &["*"])
            .pick_file()
            .map(|p| p.to_string_lossy().to_string())
    })
    .await
    .unwrap_or(None)
}

#[tauri::command]
async fn select_image_dialog() -> Option<String> {
    tokio::task::spawn_blocking(|| {
        tauri::api::dialog::blocking::FileDialogBuilder::new()
            .set_title("Select Game Banner Image")
            .add_filter("Image Files (*.png, *.jpg, *.jpeg, *.webp, *.bmp)", &["png", "jpg", "jpeg", "webp", "bmp"])
            .add_filter("All Files", &["*"])
            .pick_file()
            .map(|p| p.to_string_lossy().to_string())
    })
    .await
    .unwrap_or(None)
}

// Spawn process, batch file, or powershell script
fn spawn_target(target_path: &str, raw_args: Option<&str>) -> std::io::Result<std::process::Child> {
    let path_obj = Path::new(target_path);
    let parent_dir = path_obj.parent();
    let ext = path_obj
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    let args_list: Vec<&str> = raw_args
        .map(|s| s.split_whitespace().collect())
        .unwrap_or_default();

    if ext == "ps1" {
        let mut cmd = Command::new("powershell.exe");
        cmd.args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", target_path]);
        cmd.args(args_list);
        if let Some(dir) = parent_dir {
            cmd.current_dir(dir);
        }
        cmd.spawn()
    } else if ext == "bat" || ext == "cmd" {
        let mut cmd = Command::new("cmd.exe");
        cmd.args(["/c", target_path]);
        cmd.args(args_list);
        if let Some(dir) = parent_dir {
            cmd.current_dir(dir);
        }
        cmd.spawn()
    } else {
        let mut cmd = Command::new(target_path);
        cmd.args(args_list);
        if let Some(dir) = parent_dir {
            cmd.current_dir(dir);
        }
        cmd.spawn()
    }
}

#[tauri::command]
async fn launch_profile(window: Window, payload: LaunchPayload) -> Result<bool, String> {
    let apps = payload.companion_apps;

    // 1. Process companion apps sequentially
    for (i, app) in apps.iter().enumerate() {
        let exe = match &app.exe_path {
            Some(p) if !p.trim().is_empty() => p,
            _ => {
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index: i,
                        status: "error".into(),
                        message: format!("Skipped {}: Path not set.", app.name),
                        pid: None,
                    },
                );
                continue;
            }
        };

        if !Path::new(exe).exists() {
            let _ = window.emit(
                "launch:status",
                StatusUpdate {
                    step_index: i,
                    status: "error".into(),
                    message: format!("File not found on disk: \"{}\". Please edit path in Settings.", exe),
                    pid: None,
                },
            );
            continue;
        }

        if check_running(exe.clone()) {
            let _ = window.emit(
                "launch:status",
                StatusUpdate {
                    step_index: i,
                    status: "already_running".into(),
                    message: format!("{} is already running on your PC. Skipping duplicate launch.", app.name),
                    pid: None,
                },
            );
            continue;
        }

        let delay_sec = app.delay.unwrap_or(0);
        if delay_sec > 0 {
            let _ = window.emit(
                "launch:status",
                StatusUpdate {
                    step_index: i,
                    status: "pending".into(),
                    message: format!("Waiting {}s before starting {}...", delay_sec, app.name),
                    pid: None,
                },
            );
            tokio::time::sleep(Duration::from_secs(delay_sec)).await;
        }

        let _ = window.emit(
            "launch:status",
            StatusUpdate {
                step_index: i,
                status: "running".into(),
                message: format!("Starting {}...", app.name),
                pid: None,
            },
        );

        match spawn_target(exe, app.args.as_deref()) {
            Ok(child) => {
                let pid = child.id();
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index: i,
                        status: "completed".into(),
                        message: format!("Launched {} (PID: {})", app.name, pid),
                        pid: Some(pid),
                    },
                );
            }
            Err(e) => {
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index: i,
                        status: "error".into(),
                        message: format!("Failed to start {}: {}", app.name, e),
                        pid: None,
                    },
                );
            }
        }
    }

    // 2. Launch Main Game (if specified)
    if let Some(game_exe) = payload.game_exe {
        if !game_exe.trim().is_empty() {
            let game_step = apps.len();

            if !Path::new(&game_exe).exists() {
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index: game_step,
                        status: "error".into(),
                        message: format!("Game executable not found on disk: \"{}\". Please check path.", game_exe),
                        pid: None,
                    },
                );
                return Ok(true);
            }

            if check_running(game_exe.clone()) {
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index: game_step,
                        status: "already_running".into(),
                        message: format!("{} is already running on your PC.", payload.game_name),
                        pid: None,
                    },
                );
                return Ok(true);
            }

            let _ = window.emit(
                "launch:status",
                StatusUpdate {
                    step_index: game_step,
                    status: "running".into(),
                    message: format!("Launching main game: {}...", payload.game_name),
                    pid: None,
                },
            );

            match spawn_target(&game_exe, payload.game_args.as_deref()) {
                Ok(child) => {
                    let pid = child.id();
                    let _ = window.emit(
                        "launch:status",
                        StatusUpdate {
                            step_index: game_step,
                            status: "completed".into(),
                            message: format!("Started {} successfully! (PID: {})", payload.game_name, pid),
                            pid: Some(pid),
                        },
                    );
                }
                Err(e) => {
                    let _ = window.emit(
                        "launch:status",
                        StatusUpdate {
                            step_index: game_step,
                            status: "error".into(),
                            message: format!("Failed to start {}: {}", payload.game_name, e),
                            pid: None,
                        },
                    );
                }
            }
        }
    }

    Ok(true)
}

#[tauri::command]
async fn check_update() -> Result<UpdateResponse, String> {
    let client = reqwest::Client::builder()
        .user_agent("ApexLaunch-Sim-Deck-App")
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get("https://api.github.com/repos/vincentdthe/apex-sim-deck/releases/latest")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let body: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        let tag_name = body["tag_name"].as_str().unwrap_or("v1.0.1").to_string();
        let clean_version = tag_name.trim_start_matches('v');
        let update_available = compare_semver(clean_version, CURRENT_VERSION) > 0;
        let release_notes = body["body"].as_str().unwrap_or("No release notes.").to_string();
        let release_url = body["html_url"].as_str().unwrap_or("https://github.com/vincentdthe/apex-sim-deck/releases").to_string();

        let mut download_url = release_url.clone();
        if let Some(assets) = body["assets"].as_array() {
            for asset in assets {
                if let Some(name) = asset["name"].as_str() {
                    if name.ends_with(".zip") || name.ends_with(".exe") {
                        if let Some(url) = asset["browser_download_url"].as_str() {
                            download_url = url.to_string();
                            break;
                        }
                    }
                }
            }
        }

        Ok(UpdateResponse {
            success: true,
            current_version: CURRENT_VERSION.into(),
            latest_version: tag_name,
            update_available,
            release_notes,
            download_url,
            release_url,
        })
    } else {
        Ok(UpdateResponse {
            success: false,
            current_version: CURRENT_VERSION.into(),
            latest_version: CURRENT_VERSION.into(),
            update_available: false,
            release_notes: "".into(),
            download_url: "".into(),
            release_url: "".into(),
        })
    }
}

fn compare_semver(v1: &str, v2: &str) -> i32 {
    let p1: Vec<u32> = v1.split('.').filter_map(|s| s.parse().ok()).collect();
    let p2: Vec<u32> = v2.split('.').filter_map(|s| s.parse().ok()).collect();
    let len = p1.len().max(p2.len());

    for i in 0..len {
        let n1 = p1.get(i).copied().unwrap_or(0);
        let n2 = p2.get(i).copied().unwrap_or(0);
        if n1 > n2 {
            return 1;
        }
        if n1 < n2 {
            return -1;
        }
    }
    0
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let check_updates = CustomMenuItem::new("check_updates".to_string(), "Check for Updates...");
    let github = CustomMenuItem::new("github".to_string(), "GitHub Repository");
    let about = CustomMenuItem::new("about".to_string(), "About ApexLaunch Sim Deck");

    let file_menu = Submenu::new("File", Menu::new().add_item(quit));
    let help_menu = Submenu::new(
        "Help",
        Menu::new()
            .add_item(check_updates)
            .add_native_item(MenuItem::Separator)
            .add_item(github)
            .add_item(about),
    );

    let menu = Menu::new().add_submenu(file_menu).add_submenu(help_menu);

    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "quit" => {
                std::process::exit(0);
            }
            "github" => {
                let _ = open::that("https://github.com/vincentdthe/apex-sim-deck");
            }
            "about" => {
                // Info dialog
            }
            "check_updates" => {
                let window = event.window();
                let _ = window.emit("app:manualUpdateTrigger", ());
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            check_running,
            launch_profile,
            check_update,
            select_exe_dialog,
            select_image_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
