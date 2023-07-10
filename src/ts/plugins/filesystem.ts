
import * as fs from "@tauri-apps/api/fs";

class FileSystem {

    /**
     * Base / Root path for this instance
     */
    private basePath: string = 'GLMY';

    /**
     * Base / Root directory for this instance
     */
    private baseDir: fs.BaseDirectory;

    /**
     * State is last action created an error
     */
    private lastError: boolean|null = null;

    /**
     * Last message, if any.
     */
    private lastErrorMessage: string|null = null;;

    /**
     * Create a new FileSystem instance
     * @param basePath 
     * @param baseDir 
     */
    constructor(basePath: string, baseDir: fs.BaseDirectory = fs.BaseDirectory.Document) {
        basePath = this.slashes(basePath);
        this.basePath += basePath.length > 0 ? '/' + basePath : '';
        this.baseDir = baseDir;
    }

    /**
     * Change Base Path
     * @param basePath 
     */
    public changeBasePath(basePath: string): void {
        basePath = this.slashes(basePath);
        this.basePath = 'GLMY' + (basePath.length > 0 ? '/' + basePath : '');
    }

    /**
     * Helper - Strip and unify directory separators.
     * @param path 
     * @returns 
     */
    public slashes(path: string) {
        path = path.replace(/\\/g, '/').trim();
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        return path;
    }

    /**
     * Join path segments
     * @param segments 
     * @returns 
     */
    public join(...segments: string[]): string {
        segments = segments
            .map(segment => this.slashes(segment))
            .filter(segment => segment.length > 0);
        
        let path = this.basePath.length > 0 ? this.basePath + '/' : '';
        let entryPath = segments.join('/');
        return entryPath.startsWith(path) ? entryPath : path + entryPath;
    }

    /**
     * Check if error occurred on last operation 
     * @returns 
     */
    public getLastError(): boolean|null {
        return this.lastError;
    }

    /**
     * Get error message of last operation
     * @returns 
     */
    public getLastErrorMessage(): string|null {
        return this.lastErrorMessage;
    }

    /**
     * Handle FileSystem Operation
     * @param callback 
     * @param args 
     * @returns 
     */
    private async operate(callback: Function, args: any[]): Promise<any> {
        let status = true;
        let message = null;

        let result = null;
        try {
            result = await callback(...args);
        } catch (err) {
            status = false;
            if (err instanceof Error) {
                message = err.message;
            } else if (typeof (err as any).toString === 'function') {
                message = (err as any).toString();
            }
        }

        if (!status) {
            this.lastError = true;
            this.lastErrorMessage = message || 'An unknown error occurred';
        }
        return status ? result ?? status : status;
    }

    /**
     * Check if file or folder exists.
     * @param path 
     * @returns 
     */
    public async exists(path: string): Promise<boolean> {
        return await this.operate(fs.exists, [this.join(path), {
            dir: this.baseDir
        }]);
    }

    /**
     * Read File
     * @param path 
     * @returns 
     */
    public async readFile(path: string): Promise<string|false> {
        return await this.operate(fs.readTextFile, [this.join(path), {
            dir: this.baseDir,
        }]);
    }

    /**
     * Read directory
     * @param path 
     * @param recursive 
     * @returns 
     */
    public async readDir(path: string, recursive: boolean = true): Promise<fs.FileEntry[]|false> {
        return await this.operate(fs.readDir, [this.join(path), {
            dir: this.baseDir,
            recursive
        }]);
    }

    /**
     * Create a new file or directory.
     * @param path 
     * @param type 
     * @returns 
     */
    public async create(path: string, type: 'file' | 'directory'): Promise<boolean> {
        if (type === 'file') {
            return await this.operate(fs.writeFile, [this.join(path), '', {
                dir: this.baseDir
            }]);
        } else {
            return await this.operate(fs.createDir, [this.join(path), {
                dir: this.baseDir
            }]);
        }
    }

    /**
     * Create a new file
     * @param path 
     * @returns 
     */
    public async createFile(path: string): Promise<boolean> {
        return await this.operate(fs.writeFile, [this.join(path), '', {
            dir: this.baseDir
        }])
    }

    /**
     * Create a new directory
     * @param path 
     * @returns 
     */
    public async createDir(path: string): Promise<boolean> {
        return await this.operate(fs.createDir, [this.join(path), {
            dir: this.baseDir
        }]);
    }

    /**
     * Write file
     * @param path 
     * @param content 
     * @param create 
     * @returns 
     */
    public async writeFile(path: string, content: string, create: boolean = true): Promise<boolean> {
        return await this.operate(fs.writeTextFile, [this.join(path), content, {
            create,
            dir: this.baseDir
        }]);
    }

    /**
     * Rename path
     * @param oldPath 
     * @param newPath 
     * @returns 
     */
    public async rename(oldPath: string, newPath: string): Promise<boolean> {
        return await this.operate(fs.renameFile, [this.join(oldPath), this.join(newPath), {
            dir: this.baseDir
        }]);
    }

    /**
     * Delete a new file or directory.
     * @param path 
     * @param type 
     * @returns 
     */
    public async delete(path: string, type: 'file' | 'directory'): Promise<boolean> {
        if (type === 'file') {
            return await this.operate(fs.removeFile, [this.join(path), {
                dir: this.baseDir
            }]);
        } else {
            return await this.operate(fs.removeDir, [this.join(path), {
                dir: this.baseDir
            }]);
        }
    }

    /**
     * Delete File
     * @param path 
     * @returns 
     */
    public async deleteFile(path: string): Promise<boolean> {
        return await this.operate(fs.removeFile, [this.join(path), {
            dir: this.baseDir
        }]);
    }

    /**
     * Delete directory
     * @param path 
     * @returns 
     */
    public async deleteDir(path: string): Promise<boolean> {
        return await this.operate(fs.removeDir, [this.join(path), {
            dir: this.baseDir
        }]);
    }

}

// Export Module
export default FileSystem;
