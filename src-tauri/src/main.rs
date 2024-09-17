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
            get_board_info
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
