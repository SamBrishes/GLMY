// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs::{self, File};
use std::io::Read;
use serde_json::{json, Value};

mod glmy;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

/**
 * Initialize Application
 */
#[tauri::command]
fn initialize(home: &str) -> String {
    let home = glmy::home_dir(home);
    if home.is_none() {
        let response = json!({
            "status": "error",
            "message": "The GLMY home directory does not exist and could not be created."
        });
        return response.to_string();
    }

    // Config File
    let mut config = home.unwrap();
    config.push("config.json");

    // Create or Read Config file
    let data: Option<Value> = if !config.exists() {
        let defaults = json!({
            "version": "0.1.0",
            "paths": {
                "home": "C:\\Users\\ziegler\\Desktop\\GLMY",
                "notes": "<home>/notes",
                "todos": "<home>/todos",
                "bookmarks": "<home>/bookmarks",
                "databases": "<home>/databases"
            }
        });

        let result = match fs::write(&config, defaults.to_string()) {
            Ok(_data) => Some(defaults),
            Err(_error) => None,
        };
        result
    } else {
        let mut file = File::open(config).unwrap();
        let mut data = String::new();
        file.read_to_string(&mut data).unwrap();
        
        let config: Option<Value> = match serde_json::from_str(&data) {
            Ok(result) => Some(result),
            Err(_error) => None
        };
        config
    };

    // Return
    let response = if data.is_none() {
        let response = json!({
            "status": "error",
            "message": "The GLMY configuration file does not exist and could not be created."
        });
        response
    } else {
        let response = json!({
            "status": "success",
            "result": data.unwrap()
        });
        response
    };
    return response.to_string();
}


/**
 * Read Directory
 */
#[tauri::command]
fn read_dir(subpath: &str) -> String {
    let home = glmy::home_dir("");
    if home.is_none() {
        let response = json!({
            "status": "error",
            "message": "The GLMY home directory does not exist and could not be created."
        });
        return response.to_string();
    }

    let mut path = home.unwrap();
    if subpath.len() > 0 && subpath != "/" {
        path.push(subpath);
    }

    let response = match fs::read_dir(&path) {
        Ok(result) => {
            let mut count: u32 = 0;

            let entries: Vec<String> = result
                .into_iter()
                .inspect(|_| count += 1)
                .filter_map(|entry| entry.ok())
                .map(|entry| entry.path().into_os_string().into_string().unwrap())
                .collect::<Vec<String>>();

            let response = json!({
                "status": "success",
                "result": {
                    "count": count,
                    "entries": entries,
                    "total": entries.len(),
                }
            });
            response
        },

        Err(e) => {
            let response = json!({
                "status": "error",
                "message": e.to_string(),
                "details": {
                    "path": path.into_os_string().into_string().unwrap()
                }
            });
            response
        },
    };

    return response.to_string();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            initialize,
            read_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
