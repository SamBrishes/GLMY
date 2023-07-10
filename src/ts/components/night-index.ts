
import { BaseDirectory, FileEntry, createDir, readDir, renameFile, writeTextFile } from "@tauri-apps/api/fs";
import Sortable from "sortablejs";
import NightContext from "./night-context";
import isValidFilename from "../support/valid-filename";
import NightTooltip from "./night-tooltip";
import AbstractComponent from "../abstract/component";

type NewFileEntry = FileEntry & {
    type: 'file' | 'folder',
    subPath: string;
};

class NightIndex extends AbstractComponent {

    /**
     * FileList Map
     */
    private fileList: Map<string, HTMLLIElement>;

    /**
     * Sortables Map
     */
    private sortables: Map<HTMLUListElement, Sortable>;

    /**
     * Create a new NightIndex component instance
     */
    constructor() {
        super();
        this.fileList = new Map;
        this.sortables = new Map;
    }

    /**
     * Get Root Path
     */
    get path(): string|null {
        return this.getAttribute('path');
    }

    /**
     * Set Root Path
     */
    set path(value: string|null) {
        if (value === null) {
            this.removeAttribute('path');
        } else {
            this.setAttribute('path', value);
        }
    }

    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.addEventListener('click', (evt) => {
            this.onLiveClick(evt);
        });

        await this.render();
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        
    }

    /**
     *  Live onClick handler
     */
    public async onLiveClick(event: Event) {
        let target = event.target instanceof Element ? event.target : null;
        if (!target) {
            return;
        }

        // Skip Icons 
        if (target.localName === 'SVG' || target.closest('SVG') !== null) {
            target = (target.localName === 'SVG' ? target : target.closest('SVG')) as HTMLElement;
            target = target.parentElement as HTMLElement;
        }

        // Check for action
        if (target.matches('[name="action"]')) {
            if (target.getAttribute('value') === 'context') {
                return this.toggleContextMenu(target as HTMLElement);
            }
        }

        // Check for Item
        let item = target.matches('[data-path][data-type]') ? target : null;
        if (!item && target.closest('[data-path][data-type]')) {
            item = target.closest('[data-path][data-type]');
        }
        if (item && item instanceof HTMLElement) {
            this.dispatch(`open:${item.dataset.type}`, {
                path: item.dataset.path
            });
        }
    }

    /**
     * Toggle Context Menu
     * @param target
     */
    public async toggleContextMenu(target: HTMLElement) {
        if (target.classList.contains('active')) {
            return;
        }
        const contextMenu = new NightContext(target, {
            items: [
                {
                    label: 'Open',
                    action: () => {
                        let entryItem = target.closest('[data-path]') as HTMLElement|null;
                        if (!entryItem) {
                            return;
                        }
    
                        this.dispatch(`open:${entryItem.dataset.type}`, {
                            path: entryItem.dataset.path
                        });
                        contextMenu.hide();
                    }
                },
                {
                    label: 'Rename',
                    action: () => {
    
                    }
                },
                {
                    label: 'Delete',
                    icon: `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                        </svg>
                    `,
                    action: null,
                    danger: true
                }
            ]
        });

        contextMenu.on('show', () => {
            target.classList.add('active');
        });

        contextMenu.on('hide', () => {
            target.classList.remove('active');
        });

        contextMenu.show();
    }

    /**
     * Add a placeholder to create a new file or folder
     * @param path
     * @param type
     */
    public addPlaceholder(path: string, type: 'file' | 'folder') {
        const createCallback = async () => {
            let entryName = input.value.trim();
            if (!isValidFilename(entryName)) {
                (new NightTooltip(input, {
                    text: 'The passed entry name is not a valid file or folder name.',
                    duration: 2000
                })).show();
                input.focus();
                return;
            }

            if (this.fileList.has(path + entryName)) {
                (new NightTooltip(input, {
                    text: 'The passed entry name does already exist.',
                    duration: 2000
                })).show();
                input.focus();
                return;
            }

            placeholder.remove();
            await this.create(entryName, path, type === 'file');
            await this.render();
        };

        const cancelCallback = async () => {
            input.blur();
            placeholder.remove();
        };

        // Create Placeholder
        let placeholder = this.renderPlaceholder(type);
        this.querySelector('.filelist.depth-0')?.append(placeholder);

        // Focus Placeholder
        let input = placeholder.querySelector('input') as HTMLInputElement;
        input.focus();

        // Cancel on Escape, Create on Enter
        input.addEventListener('keydown', async (evt) => {
            if (evt.key === 'Escape') {
                await cancelCallback();
            }
            if (evt.key === 'Enter') {
                await createCallback();
            }
        });

        // Create on Blur
        input.addEventListener('blur', async (evt) => {
            await createCallback();
        });
    }

    /**
     * List directory contents
     */
    public async listContents() {
        let response: FileEntry[] = await readDir(`GLMY/${this.path}`, {
            dir: BaseDirectory.Document,
            recursive: true
        });
        if (!Array.isArray(response)) {
            return [];
        }

        // Turn & Order Lists
        let turnList = (list: FileEntry[]): NewFileEntry[] => {
            let newList = list.map(item => {
                if (typeof item.children !== 'undefined' && Array.isArray(item.children)) {
                    item.children = turnList(item.children) as any;
                }

                let subPath = item.path.split(`GLMY/${this.path}`)[1];
                subPath = subPath.replace(/\\/g, '/');

                return {
                    type: typeof item.children === 'undefined' ? 'file' : 'folder',
                    subPath,
                    ...item,
                } as NewFileEntry;
            });

            newList.sort((a, b) => {
                if (a.type === b.type) {
                    return 0;
                }
                return a.type === 'file' ? 1 : -1;
            });

            return newList as NewFileEntry[];
        };

        // Turn List & Return
        let result = turnList(response);
        return result;
    }

    /**
     * Create a new file or folder
     * @param name 
     * @param path 
     * @param isFile
     * @returns
     */
    public async create(name: string, path: string = '/', isFile: boolean = false): Promise<boolean> {
        let subpath = this.path + '/';
        if (path !== '/' && path.length > 1) {
            path = path.startsWith('/') ? path.slice(1) : path;
            path = path.endsWith('/') ? path.slice(0, -1) : path;
            subpath += path;
        }

        try {
            if (isFile) {
                await writeTextFile(`GLMY/${subpath}/${name}`, '', {
                    dir: BaseDirectory.Document
                });
            } else {
                await createDir(`GLMY/${subpath}/${name}`, {
                    dir: BaseDirectory.Document
                });
            }
            return true;
        } catch(e) {
            return false;
        }
    }

    /**
     * Create a new folder
     * @param name 
     * @param path 
     */
    public async createFolder(name: string, path: string = '/'): Promise<boolean> {
        return await this.create(name, path, false);
    }

    /**
     * Create a new file
     * @param name 
     * @param path 
     */
    public async createFile(name: string, path: string = '/'): Promise<boolean> {
        return await this.create(name, path, true);
    }

    /**
     * Render Component
     */
    public async render() {
        let entries = await this.listContents();

        // Build List
        const list = document.createElement('ul');
        list.className = `filelist depth-0`;
        for (const entry of entries) {
            list.append(this.renderItem(entry, 1));
        }
        this.append(list);

        // Make Lists Sortable
        const fileLists = this.querySelectorAll('.filelist') as NodeListOf<HTMLUListElement>;
        Array.from(fileLists).forEach(fileList => {
            if (!this.sortables.has(fileList)) {
                this.sortables.set(fileList, Sortable.create(fileList, {
                    animation: 150,
                    draggable: '.filelist-item',
                    group: 'filelist',
                    handle: '.item-move',
                    delayOnTouchOnly: true,
                    fallbackOnBody: false,
                    swapThreshold: 0.65,
                    forceFallback: navigator.userAgent.indexOf("Edg") >= 0  // Need to force fallback on Edge browsers / WebView2
                }));
            }
        });
    }

    /**
     * Render a new FileList item
     * @param entry
     * @param depth
     * @returns
     */
    public renderItem(entry: NewFileEntry, depth: number = 1): HTMLLIElement {
        if (this.fileList.has(entry.subPath)) {
            return this.fileList.get(entry.subPath) as HTMLLIElement;
        }

        // Create Item
        let item = document.createElement('li') as HTMLLIElement;
        item.className = `filelist-item type-${entry.type}`;
        item.dataset.type = entry.type;
        item.dataset.path = entry.subPath;
        this.fileList.set(entry.subPath, item);

        // Create Inner
        let link = document.createElement('a');
        link.href = `#!${entry.name}`;
        link.innerHTML = `
            <span class="item-move">
                ${entry.type === 'folder'? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16">
                        <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                    </svg>
                ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journal" viewBox="0 0 16 16">
                        <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                        <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
                    </svg>
                `}
            </span>

            <span class="item-label">${entry.name}</span>

            <div class="item-actions">
                <button type="button" class="toolbar-btn" name="action" value="context">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
                        <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                    </svg>
                </button>
            </div>
        `;
        item.append(link);

        // Append SubLists
        if (entry.children) {
            const subList = document.createElement('ul');
            subList.className = `filelist depth-${depth}`;

            for (const child of entry.children) {
                subList.append(this.renderItem(child as NewFileEntry, depth+1));
            }
        }

        // Return Item
        return item;
    }

    /**
     * Render a new FileList placeholder
     * @param type
     */
    public renderPlaceholder(type: 'file' | 'folder'): HTMLLIElement {
        let item = document.createElement('li') as HTMLLIElement;
        item.className = `filelist-item type-${type}`;

        let link = document.createElement('a');
        link.innerHTML = `
            <span class="item-move">
                ${type === 'folder'? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16">
                        <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                    </svg>
                ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journal" viewBox="0 0 16 16">
                        <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                        <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
                    </svg>
                `}
            </span>

            <span class="item-label">
                <input type="text" name="${type}_name" value="" />
            </span>

            <div class="item-actions">
                <button type="button" class="toolbar-btn" name="action" value="context">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
                        <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                    </svg>
                </button>
            </div>
        `;
        item.append(link);

        return item;
    }

}

// Define custom element
window.customElements.define('night-index', NightIndex);

// Export Module
export default NightIndex;
