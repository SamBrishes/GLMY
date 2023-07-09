
type RatStorageCallback = (newValue: any, oldValue: any, key: string, storage: RatStorage) => void;

class RatStorage {

    /**
     * Key-Prefix for this Storage instance
     */
    private prefix: string;

    /**
     * Used native browser storage engine for this Storage instance
     */
    private engine: Storage;

    /**
     * All available Storage Listeners
     */
    private listeners: { [key: string]: RatStorageCallback[] };

    /**
     * Create a new RatStorage class
     * @param prefix 
     * @param storageEngine 
     */
    constructor(prefix: string|null = null, storageEngine: Storage = localStorage) {
        this.prefix = prefix === null ? '' : prefix;
        if (this.prefix.length > 0 && !this.prefix.endsWith(':')) {
            this.prefix += ':';
        }
        this.engine = storageEngine;
        this.listeners = {};
    }

    /**
     * Prepare / Prefix Storage Key
     * @param key 
     * @returns 
     */
    public prepare(key: string): string {
        if (this.prefix.length === 0) {
            return key;
        }
        return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
    }

    /**
     * Encode Value to be stored
     * @param value 
     * @returns 
     */
    public encode(value: unknown): string {
        if (typeof value === 'undefined' || value === null) {
            value = '';
        } else if (typeof value === 'boolean') {
            value = value === true ? 'true' : 'false';
        } else if (typeof value === 'object') {
            value = JSON.stringify(value);
        } else if (typeof value !== 'string') {
            value = value.toString();
        }
        return value as string;
    }

    /**
     * Decode Value from storage
     * @param value 
     * @returns 
     */
    public decode(value: string): unknown {
        if (typeof value !== 'string') {
            return value;
        } else if (value === '') {
            return null;
        }

        if (value.toLowerCase() === 'true') {
            return true;
        } else if (value.toLowerCase() === 'false') {
            return false;
        }

        if (value[0] === '{' || value[0] === '[') {
            return JSON.parse(value);
        } else if (/^[0-9]+(\.[0-9]+)?$/.test(value)) {
            return value.indexOf('.') >= 0 ? parseFloat(value) : parseInt(value);
        } else {
            return value;
        }
    }

    /**
     * Check is storage key exists.
     * @param key 
     */
    public exists(key: string) {
        return this.engine.getItem(this.prepare(key)) !== null;
    }

    /**
     * Check is storage key exists.
     * @param key 
     */
    public has(key: string) {
        return this.exists(key);
    }

    /**
     * Get storage value by key
     * @param key 
     * @param defaultValue 
     * @returns 
     */
    public get(key: string, defaultValue: any = null) {
        const value = this.engine.getItem(this.prepare(key));
        if (value === null) {
            return defaultValue;
        } else {
            return this.decode(value);
        }
    }

    /**
     * Get all storage data
     */
    public all(): { [key: string]: any } {
        const result: { [key: string]: any } = {};
        for (let i = 0; i < this.engine.length; i++) {
            const key = this.engine.key(i);
            if (key === null) {
                continue;
            }

            if (this.prefix === '' && key.indexOf(':') < 0) {
                result[key] = this.encode(this.engine.getItem(key));
            } else if (this.prefix.length > 0 && key.startsWith(this.prefix)) {
                result[key] = this.encode(this.engine.getItem(key));
            }
        }
        return result;
    }

    /**
     * Store storage data
     * @param key 
     * @param value 
     */
    public set(key: string, value: any): void {
        const oldValue = this.get(key, null);

        if (typeof this.listeners[key] !== 'undefined') {
            this.listeners[key].forEach((cb: RatStorageCallback) => cb(value, oldValue, key, this));
        }
        if (typeof this.listeners['_all'] !== 'undefined') {
            this.listeners['_all'].forEach((cb: RatStorageCallback) => cb(value, oldValue, key, this));
        }

        this.engine.setItem(this.prepare(key), this.encode(value));
    }

    /**
     * Remove Storage data
     * @param key 
     */
    public remove(key: string): void {
        const oldValue = this.get(key, null);

        if (typeof this.listeners[key] !== 'undefined') {
            this.listeners[key].forEach((cb: RatStorageCallback) => cb(null, oldValue, key, this));
        }
        if (typeof this.listeners['_all'] !== 'undefined') {
            this.listeners['_all'].forEach((cb: RatStorageCallback) => cb(null, oldValue, key, this));
        }

        this.engine.removeItem(this.prepare(key));
    }

    /**
     * Unset Storage data
     * @param key 
     * @returns 
     */
    public delete(key: string): void {
        return this.remove(this.prepare(key));
    }

    /**
     * Unset Storage data
     * @param key 
     * @returns 
     */
    public unset(key: string): void {
        return this.remove(this.prepare(key));
    }

    /**
     * Clear Storage Data
     */
    public clear() {
        const unset: string[] = [];
        for (let i = 0; i < this.engine.length; i++) {
            const key = this.engine.key(i);
            if (key === null) {
                continue;
            }

            if (this.prefix === '' && key.indexOf(':') < 0) {
                unset.push(key);
            } else if (this.prefix.length > 0 && key.startsWith(this.prefix)) {
                unset.push(key);
            }
        }
        unset.map(key => this.engine.removeItem(key));
    }

    /**
     * Listen to all changes
     * @param callback 
     */
    public listen(callback: RatStorageCallback) {
        if (typeof this.listeners['_all'] === 'undefined') {
            this.listeners['_all'] = [];
        }
        this.listeners['_all'].push(callback);
    }

    /**
     * Listen to a specific change
     * @param key 
     * @param callback 
     */
    public listenTo(key: string, callback: RatStorageCallback) {
        if (typeof this.listeners[key] === 'undefined') {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }

}

// Export Module
export default RatStorage;
