// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use std::time::Duration;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, Window};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CURRENT_VERSION: &str = "1.0.1";
#[allow(dead_code)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(windows)]
mod win_proc {
    use std::collections::HashSet;
    use std::ffi::c_void;

    type HANDLE = *mut c_void;
    type BOOL = i32;
    type DWORD = u32;

    const INVALID_HANDLE_VALUE: HANDLE = -1isize as HANDLE;
    const TH32CS_SNAPPROCESS: DWORD = 0x00000002;

    #[repr(C)]
    #[allow(non_snake_case)]
    struct PROCESSENTRY32W {
        dwSize: DWORD,
        cntUsage: DWORD,
        th32ProcessID: DWORD,
        th32DefaultHeapID: usize,
        th32ModuleID: DWORD,
        cntThreads: DWORD,
        th32ParentProcessID: DWORD,
        pcPriClassBase: i32,
        dwFlags: DWORD,
        szExeFile: [u16; 260],
    }

    extern "system" {
        fn CreateToolhelp32Snapshot(dwFlags: DWORD, th32ProcessID: DWORD) -> HANDLE;
        fn Process32FirstW(hSnapshot: HANDLE, lppe: *mut PROCESSENTRY32W) -> BOOL;
        fn Process32NextW(hSnapshot: HANDLE, lppe: *mut PROCESSENTRY32W) -> BOOL;
        fn CloseHandle(hObject: HANDLE) -> BOOL;
    }

    pub fn get_all_running_processes() -> HashSet<String> {
        let mut processes = HashSet::new();
        unsafe {
            let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snapshot == INVALID_HANDLE_VALUE {
                return processes;
            }

            let mut entry = std::mem::zeroed::<PROCESSENTRY32W>();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as DWORD;

            if Process32FirstW(snapshot, &mut entry) != 0 {
                loop {
                    let len = entry.szExeFile.iter().position(|&c| c == 0).unwrap_or(entry.szExeFile.len());
                    let exe_name = String::from_utf16_lossy(&entry.szExeFile[..len]).to_lowercase();
                    if !exe_name.is_empty() {
                        processes.insert(exe_name);
                    }
                    if Process32NextW(snapshot, &mut entry) == 0 {
                        break;
                    }
                }
            }

            CloseHandle(snapshot);
        }
        processes
    }

    pub fn is_pid_alive(target_pid: u32) -> bool {
        unsafe {
            let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snapshot == INVALID_HANDLE_VALUE {
                return false;
            }

            let mut entry = std::mem::zeroed::<PROCESSENTRY32W>();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as DWORD;

            let mut found = false;
            if Process32FirstW(snapshot, &mut entry) != 0 {
                loop {
                    if entry.th32ProcessID == target_pid {
                        found = true;
                        break;
                    }
                    if Process32NextW(snapshot, &mut entry) == 0 {
                        break;
                    }
                }
            }

            CloseHandle(snapshot);
            found
        }
    }
}

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
    #[serde(rename = "sessionProcesses", default)]
    pub session_processes: Vec<String>,
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
    pub name: Option<String>,
}

#[derive(Debug, Clone)]
pub struct AutoKillTarget {
    pub name: String,
    pub exe_name: Option<String>,
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

    #[cfg(windows)]
    {
        let procs = win_proc::get_all_running_processes();
        procs.contains(&file_name) || procs.contains(&truncated_name)
    }
    #[cfg(not(windows))]
    {
        false
    }
}

fn get_running_session_process(session_processes: &[String]) -> Option<String> {
    if session_processes.is_empty() {
        return None;
    }

    #[cfg(windows)]
    {
        let running_images = win_proc::get_all_running_processes();
        for proc in session_processes {
            let clean = proc.trim().to_lowercase();
            let truncated: String = clean.chars().take(25).collect();
            if running_images.contains(&clean) || running_images.contains(&truncated) {
                return Some(proc.clone());
            }
        }
        None
    }
    #[cfg(not(windows))]
    {
        None
    }
}

fn check_pid_running(pid: u32) -> bool {
    #[cfg(windows)]
    {
        win_proc::is_pid_alive(pid)
    }
    #[cfg(not(windows))]
    {
        false
    }
}

fn terminate_auto_kill_apps(apps: &[AutoKillTarget]) {
    for app in apps {
        if let Some(pid) = app.pid {
            let mut cmd = Command::new("taskkill");
            cmd.args(["/PID", &pid.to_string(), "/T", "/F"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            let _ = cmd.output();
        }
        if let Some(ref exe) = app.exe_name {
            let mut cmd = Command::new("taskkill");
            cmd.args(["/IM", exe, "/T", "/F"]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            let _ = cmd.output();
        }
    }
}

async fn monitor_simulation_session(
    window: Window,
    game_pid: Option<u32>,
    game_exe: Option<String>,
    game_name: String,
    session_processes: Vec<String>,
    auto_kill_apps: Vec<AutoKillTarget>,
    step_index: usize,
) {
    if auto_kill_apps.is_empty() {
        return;
    }

    let monitored_display = if !session_processes.is_empty() {
        session_processes.iter().take(2).cloned().collect::<Vec<_>>().join(", ")
    } else if let Some(ref exe) = game_exe {
        Path::new(exe).file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| game_name.clone())
    } else {
        game_name.clone()
    };

    let _ = window.emit(
        "launch:status",
        StatusUpdate {
            step_index,
            status: "running".into(),
            message: format!(
                "Session Monitor Active: Watching for {} session ({}). Auto-close armed for {} companion app(s).",
                game_name, monitored_display, auto_kill_apps.len()
            ),
            pid: None,
            name: Some("Session Monitor & Auto-Close".into()),
        },
    );

    let mut session_active = false;
    let mut active_process_name = String::new();
    let mut poll_count = 0;

    loop {
        tokio::time::sleep(Duration::from_millis(2500)).await;
        poll_count += 1;

        // 1. Check if any session process is running
        if let Some(running_name) = get_running_session_process(&session_processes) {
            if !session_active {
                session_active = true;
                active_process_name = running_name.clone();
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index,
                        status: "running".into(),
                        message: format!("Simulation Session ACTIVE ({} detected). Auto-close armed.", running_name),
                        pid: None,
                        name: Some("Session Monitor & Auto-Close".into()),
                    },
                );
            }
            continue;
        }

        // 2. Check if launcher is still running
        let launcher_running = match (game_pid, &game_exe) {
            (Some(pid), _) if check_pid_running(pid) => true,
            (_, Some(exe)) if check_running(exe.clone()) => true,
            _ => false,
        };

        if launcher_running {
            if !session_active && poll_count % 4 == 0 {
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index,
                        status: "running".into(),
                        message: "Monitoring: Launcher active. Waiting for in-game session to start...".into(),
                        pid: None,
                        name: Some("Session Monitor & Auto-Close".into()),
                    },
                );
            }
            continue;
        }

        // 3. Neither session process nor launcher is running
        if session_active {
            let _ = window.emit(
                "launch:status",
                StatusUpdate {
                    step_index,
                    status: "running".into(),
                    message: format!(
                        "Simulation session exited ({}). Auto-closing helper apps...",
                        if active_process_name.is_empty() { &game_name } else { &active_process_name }
                    ),
                    pid: None,
                    name: Some("Session Monitor & Auto-Close".into()),
                },
            );

            terminate_auto_kill_apps(&auto_kill_apps);

            let _ = window.emit(
                "launch:status",
                StatusUpdate {
                    step_index,
                    status: "completed".into(),
                    message: format!("Session ended. Auto-closed {} companion app(s).", auto_kill_apps.len()),
                    pid: None,
                    name: Some("Session Monitor & Auto-Close".into()),
                },
            );
            break;
        } else {
            // Launcher closed without starting session (allow 10 sec grace period)
            if poll_count >= 4 {
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index,
                        status: "running".into(),
                        message: "Simulation launcher closed. Auto-closing helper apps...".into(),
                        pid: None,
                        name: Some("Session Monitor & Auto-Close".into()),
                    },
                );

                terminate_auto_kill_apps(&auto_kill_apps);

                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index,
                        status: "completed".into(),
                        message: "Auto-close complete.".into(),
                        pid: None,
                        name: Some("Session Monitor & Auto-Close".into()),
                    },
                );
                break;
            }
        }
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
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
        if let Some(dir) = parent_dir {
            cmd.current_dir(dir);
        }
        cmd.spawn()
    } else if ext == "bat" || ext == "cmd" {
        let mut cmd = Command::new("cmd.exe");
        cmd.args(["/c", target_path]);
        cmd.args(args_list);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);
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
    let mut auto_kill_targets = Vec::new();

    for app in &apps {
        if app.auto_kill == Some(true) {
            if let Some(ref path_str) = app.exe_path {
                let exe_name = Path::new(path_str)
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string());
                auto_kill_targets.push(AutoKillTarget {
                    name: app.name.clone(),
                    exe_name,
                    pid: None,
                });
            }
        }
    }

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
                        name: Some(app.name.clone()),
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
                    name: Some(app.name.clone()),
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
                    name: Some(app.name.clone()),
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
                    name: Some(app.name.clone()),
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
                name: Some(app.name.clone()),
            },
        );

        match spawn_target(exe, app.args.as_deref()) {
            Ok(child) => {
                let pid = child.id();
                if let Some(target) = auto_kill_targets.iter_mut().find(|t| t.name == app.name) {
                    target.pid = Some(pid);
                }
                let _ = window.emit(
                    "launch:status",
                    StatusUpdate {
                        step_index: i,
                        status: "completed".into(),
                        message: format!("Launched {} (PID: {})", app.name, pid),
                        pid: Some(pid),
                        name: Some(app.name.clone()),
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
                        name: Some(app.name.clone()),
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
                        name: Some(payload.game_name.clone()),
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
                        name: Some(payload.game_name.clone()),
                    },
                );
                if !auto_kill_targets.is_empty() {
                    let win_clone = window.clone();
                    let session_procs = payload.session_processes.clone();
                    let game_name = payload.game_name.clone();
                    let monitor_step = game_step + 1;
                    tokio::spawn(async move {
                        monitor_simulation_session(
                            win_clone,
                            None,
                            Some(game_exe),
                            game_name,
                            session_procs,
                            auto_kill_targets,
                            monitor_step,
                        )
                        .await;
                    });
                }
                return Ok(true);
            }

            let _ = window.emit(
                "launch:status",
                StatusUpdate {
                    step_index: game_step,
                    status: "running".into(),
                    message: format!("Launching main game: {}...", payload.game_name),
                    pid: None,
                    name: Some(payload.game_name.clone()),
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
                            name: Some(payload.game_name.clone()),
                        },
                    );

                    if !auto_kill_targets.is_empty() {
                        let win_clone = window.clone();
                        let session_procs = payload.session_processes.clone();
                        let game_name = payload.game_name.clone();
                        let monitor_step = game_step + 1;
                        tokio::spawn(async move {
                            monitor_simulation_session(
                                win_clone,
                                Some(pid),
                                Some(game_exe),
                                game_name,
                                session_procs,
                                auto_kill_targets,
                                monitor_step,
                            )
                            .await;
                        });
                    }
                }
                Err(e) => {
                    let _ = window.emit(
                        "launch:status",
                        StatusUpdate {
                            step_index: game_step,
                            status: "error".into(),
                            message: format!("Failed to start {}: {}", payload.game_name, e),
                            pid: None,
                            name: Some(payload.game_name.clone()),
                        },
                    );
                }
            }
        }
    } else if !auto_kill_targets.is_empty() && !payload.session_processes.is_empty() {
        let win_clone = window.clone();
        let session_procs = payload.session_processes.clone();
        let game_name = payload.game_name.clone();
        let monitor_step = apps.len() + 1;
        tokio::spawn(async move {
            monitor_simulation_session(
                win_clone,
                None,
                None,
                game_name,
                session_procs,
                auto_kill_targets,
                monitor_step,
            )
            .await;
        });
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
