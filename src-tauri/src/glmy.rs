
use std::env;
use std::fs;
use std::path::PathBuf;


/**
 * Get home directory
 */
pub fn home_dir(home: &str) -> Option<PathBuf> {
    if home != "" {
        let home = PathBuf::from(home);
        let home = if home.exists() {
            Some(home)
        } else {
            None
        };
        return home;
    }

    // Get real home directory.
    let home: Option<PathBuf> = match home::home_dir() {
        Some(path) => Some(path),
        None => {
            let path: Option<PathBuf> = match env::current_dir() {
                Ok(path) => Some(path),
                Err(_error) => None,
            };
            path
        },
    };
    if home.is_none() {
        return home;
    }

    let home: PathBuf = home.unwrap();

    // Enter "Documents" folder on Windows (if exists).
    let mut home = if home.exists() && cfg!(windows) {
        let mut documents = PathBuf::from(&home);
        documents.push("Documents");
        
        let home = if documents.exists() {
            documents
        } else {
            home
        };
        home
    } else {
        home
    };

    // Create and Enter GLMY folder.
    let home = if home.exists() {
        home.push("GLMY");
        
        let home: Option<PathBuf> = if !home.exists() {
            let home = match fs::create_dir(&home) {
                Ok(_result) => Some(home),
                Err(_err) => None,
            };
            home
        } else {
            Some(home)
        };
        home
    } else {
        None
    };

    return home;
}
