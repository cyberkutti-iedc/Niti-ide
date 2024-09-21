use std::fs;
use tauri::Manager;
use serialport::{available_ports, SerialPort};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use std::fmt::Write;
use tauri::command;
use winapi::um::setupapi::*;
use winapi::um::cfgmgr32::*;
use winapi::um::winbase::*;
use winapi::shared::ntdef::*;
use winapi::shared::winerror::*;
use winapi::shared::guiddef::*;
use winapi::um::handleapi::INVALID_HANDLE_VALUE;
use std::ptr;
use tauri::Window;
use std::process::{Command, Stdio};
use std::path::Path;
use std::io::{BufReader, BufRead};
use tauri::api::dialog::blocking::FileDialogBuilder;

// SharedSerialPort struct to manage serial port across threads
struct SharedSerialPort(Arc<Mutex<Option<Box<dyn SerialPort>>>>);

fn main() {
    tauri::Builder::default()
    
        .manage(SharedSerialPort(Arc::new(Mutex::new(None))))
        .invoke_handler(tauri::generate_handler![
            exit,
            list_serial_ports,
            open_file,
            save_file,
            create_new_file,
            get_about_us,
            get_github_url,
            close_serial_port,
            open_serial_port,
            write_serial_port,
            read_serial_port,
            get_board_info,
            build_project,
            run_project,
            flash_to_controller,
            open_cmd_window_and_build,
            open_file_explorer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


#[tauri::command]
fn exit() {
    std::process::exit(0);
}


#[tauri::command]
fn open_file(path: String) -> Result<String, String> {
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(err) => Err(format!("Failed to read file: {}", err)),
    }
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    match fs::write(&path, content) {
        Ok(_) => Ok(()),
        Err(err) => Err(format!("Failed to write file: {}", err)),
    }
}

#[tauri::command]
fn create_new_file() -> Result<String, String> {
    let default_path = "new_file.rs".to_string();
    match fs::write(&default_path, "") {
        Ok(_) => Ok(default_path),
        Err(err) => Err(format!("Failed to create file: {}", err)),
    }
}

#[tauri::command]
fn get_github_url() -> String {
    "https://github.com/cyberkutti-idec".to_string()
}

#[tauri::command]
fn get_about_us() -> String {
    "Sreeraj Veajesh\ncyberkutti@gmail.com\nGitHub: cyberkutti-idec".to_string()
}

#[tauri::command]
fn list_serial_ports() -> Vec<String> {
    match available_ports() {
        Ok(ports) => ports.into_iter().map(|port| port.port_name).collect(),
        Err(_) => vec!["No ports found".to_string()],
    }
}

#[tauri::command]
fn open_serial_port(port: String, state: tauri::State<SharedSerialPort>) -> Result<(), String> {
    let available_ports = available_ports().map_err(|_| "No ports available".to_string())?;
    let port_info = available_ports.into_iter().find(|p| p.port_name == port);

    if let Some(port_info) = port_info {
        let port = serialport::new(&port_info.port_name, 9600)
            .timeout(Duration::from_millis(1000))
            .open()
            .map_err(|e| format!("Failed to open port: {}", e))?;

        // Store the opened serial port in shared state
        *state.0.lock().unwrap() = Some(port);
        Ok(())
    } else {
        Err("Port not found".to_string())
    }
}

#[tauri::command]
fn read_serial_port(state: tauri::State<SharedSerialPort>) -> Result<String, String> {
    let mut buf = [0; 1024];
    let mut port_lock = state.0.lock().unwrap();

    if let Some(ref mut port) = *port_lock {
        match port.read(&mut buf) {
            Ok(bytes) => Ok(String::from_utf8_lossy(&buf[..bytes]).to_string()),
            Err(e) => Err(format!("Failed to read from port: {}", e)),
        }
    } else {
        Err("No port is open".to_string())
    }
}

#[tauri::command]
fn write_serial_port(data: String, state: tauri::State<SharedSerialPort>) -> Result<(), String> {
    let mut port_lock = state.0.lock().unwrap();

    if let Some(ref mut port) = *port_lock {
        match port.write(data.as_bytes()) {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to write to port: {}", e)),
        }
    } else {
        Err("No port is open".to_string())
    }
}

#[tauri::command]
fn close_serial_port(state: tauri::State<SharedSerialPort>) -> Result<(), String> {
    let mut port_lock = state.0.lock().unwrap();
    if let Some(port) = port_lock.take() {
        drop(port); // Close the port by dropping it
        Ok(())
    } else {
        Err("No port is open".to_string())
    }
}

#[tauri::command]
fn get_board_info() -> Result<String, String> {
    let available_ports = serialport::available_ports().map_err(|e| e.to_string())?;
    let mut board_info = String::new();

    if let Some(port_info) = available_ports.first() {
        writeln!(board_info, "Device Name: {}", port_info.port_name).ok();
        writeln!(board_info, "Port Number: {}", port_info.port_name).ok();
        writeln!(board_info, "BN: Unknown board").ok();

        if let Err(e) = fetch_device_info(&mut board_info) {
            writeln!(board_info, "Error fetching device info: {}", e).ok();
        }

        Ok(board_info)
    } else {
        Err("No ports available".to_string())
    }
}

fn fetch_device_info(board_info: &mut String) -> Result<(), String> {
    unsafe {
        let device_info_set = SetupDiGetClassDevsW(
            ptr::null_mut(),
            ptr::null_mut(),
            ptr::null_mut(),
            DIGCF_PRESENT | DIGCF_ALLCLASSES | DIGCF_DEVICEINTERFACE,
        );

        if device_info_set == INVALID_HANDLE_VALUE {
            return Err("Failed to get device information set".to_string());
        }

        let mut device_info_data: SP_DEVINFO_DATA = SP_DEVINFO_DATA {
            cbSize: std::mem::size_of::<SP_DEVINFO_DATA>() as u32,
            ..std::mem::zeroed()
        };

        let mut index = 0;
        while SetupDiEnumDeviceInfo(device_info_set, index, &mut device_info_data) != 0 {
            index += 1;

            let mut buffer: [u16; 256] = [0; 256];
            let mut buffer_size = buffer.len() as u32;
            if SetupDiGetDeviceRegistryPropertyW(
                device_info_set,
                &mut device_info_data,
                SPDRP_HARDWAREID,
                ptr::null_mut(),
                buffer.as_mut_ptr() as *mut u8,
                buffer_size,
                &mut buffer_size,
            ) != 0
            {
                let hardware_id = String::from_utf16_lossy(&buffer[..(buffer_size / 2) as usize]);

                let vid_pid_sn: Vec<&str> = hardware_id.split(&['&', ';']).collect();
                for id in vid_pid_sn {
                    if id.starts_with("VID_") {
                        writeln!(board_info, "VID: {}", &id[4..]).ok();
                    } else if id.starts_with("PID_") {
                        writeln!(board_info, "PID: {}", &id[4..]).ok();
                    }
                }
            }
        }

        SetupDiDestroyDeviceInfoList(device_info_set);

        Ok(())
    }
}

#[tauri::command]
fn build_project(file_path: String, window: tauri::Window) -> Result<(), String> {
    let project_dir = std::path::Path::new(&file_path)
        .parent()
        .and_then(|src_dir| src_dir.parent());

    if let Some(project_dir) = project_dir {
        let cargo_toml_path = project_dir.join("Cargo.toml");

        if !cargo_toml_path.exists() {
            return Err(format!("Cargo.toml not found in {}", project_dir.display()));
        }

        // Run `cargo build` and capture stdout and stderr
        let mut command = Command::new("cargo")
            .arg("build")
            .current_dir(&project_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start build: {}", e))?;

        let stdout = command.stdout.take().ok_or("Failed to capture stdout")?;
        let stderr = command.stderr.take().ok_or("Failed to capture stderr")?;

        // Create a thread to read the stdout and stderr
        let reader = BufReader::new(stdout);
        let error_reader = BufReader::new(stderr);

        let win = window.clone();
        std::thread::spawn(move || {
            for line in reader.lines() {
                if let Ok(line) = line {
                    // Send each line of output to the frontend
                    win.emit("build-output", line).unwrap();
                }
            }
        });

        let win_err = window.clone();
        std::thread::spawn(move || {
            for line in error_reader.lines() {
                if let Ok(line) = line {
                    // Send each line of error to the frontend
                    win_err.emit("build-output", format!("ERROR: {}", line)).unwrap();
                }
            }
        });

        command
            .wait()
            .map_err(|e| format!("Build process failed: {}", e))?;

        Ok(())
    } else {
        Err("Invalid file path. Unable to determine project folder.".to_string())
    }
}

#[tauri::command]
fn run_project(file_path: String, selected_port: Option<String>) -> Result<String, String> {
    let project_dir = Path::new(&file_path)
        .parent()
        .and_then(|src_dir| src_dir.parent());

    if let Some(project_dir) = project_dir {
        let cargo_toml_path = project_dir.join("Cargo.toml");

        if !cargo_toml_path.exists() {
            return Err(format!("Cargo.toml not found in {}", project_dir.display()));
        }

        // Prepare the command to run
        let mut command = Command::new("cmd");
        let mut args = vec!["/C".to_string(), "start".to_string(), "cmd".to_string(), "/K".to_string(), "cargo run".to_string()];

        if let Some(port) = selected_port {
            let port_arg = format!("--port {}", port);
            args.push(port_arg); // Push the owned port argument
        }

        // Run the command
        command
            .args(args)
            .current_dir(&project_dir)
            .output()
            .map_err(|error| format!("Failed to open CMD: {}", error))
            .map(|_| "CMD opened successfully. Running `cargo run`.".to_string())
    } else {
        Err("Invalid file path. Unable to determine project folder.".to_string())
    }
}


#[tauri::command]
fn open_cmd_window_and_build(project_dir: String) -> Result<(), String> {
    // Execute the command to open a new CMD window and run cargo build
    match Command::new("cmd")
        .args(&["/C", "start", "cmd", "/K", "cargo build"])
        .current_dir(&project_dir)
        .spawn()
    {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}

#[tauri::command]
fn flash_to_controller(port: String, elf_path: String, window: Window) -> Result<String, String> {
    if !Path::new(&elf_path).exists() {
        return Err("The specified ELF file does not exist.".to_string());
    }

    let mut command = Command::new("ravedude")
        .arg("uno")
        .arg("-P")
        .arg(port) // Use the port passed to the function
        .arg("-cb")
        .arg("57600")
        .arg(&elf_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start flash: {}", e))?;

    let stdout = command.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = command.stderr.take().ok_or("Failed to capture stderr")?;

    let win_out = window.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line) = line {
                win_out.emit("flash-output", line).unwrap_or_else(|e| {
                    eprintln!("Failed to emit flash output: {}", e);
                });
            }
        }
    });

    let win_err = window.clone();
    std::thread::spawn(move || {
        let error_reader = BufReader::new(stderr);
        for line in error_reader.lines() {
            if let Ok(line) = line {
                win_err.emit("flash-output", format!("ERROR: {}", line)).unwrap_or_else(|e| {
                    eprintln!("Failed to emit flash error output: {}", e);
                });
            }
        }
    });

    command.wait().map_err(|e| format!("Flash process failed: {}", e))?;
    Ok("Project flashed to controller.".to_string())
}

#[tauri::command]
fn open_file_explorer(path: String) -> Result<(), String> {
    Command::new("explorer")
        .arg("/select,")
        .arg(&path)
        .status()
        .map_err(|e| format!("Failed to open file explorer: {}", e))
        .and_then(|status| {
            if status.success() {
                Ok(())
            } else {
                Err("Failed to open file explorer".to_string())
            }
        })
}