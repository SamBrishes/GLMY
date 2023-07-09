
import { BaseDirectory, readTextFile } from '@tauri-apps/api/fs';
import GLMY from './glmy-app';
import NightEditor from './night-editor';
import NightIndex from './night-index';
import NightModal from './night-modal';


interface Note {
    title: string;
    description: string;
    content: string;
    [key: string|number]: any;
};

class GLMYNotes extends HTMLElement {

    /**
     * Application Root
     */
    private root: GLMY|null = null;

    /**
     * Component Index
     */
    private index: NightIndex|null = null;

    /**
     * Active Editor Tab
     */
    private activeTab: string|null = null;

    /**
     * Available Editor Tabs
     */
    private tabs: Map<string, HTMLLIElement> = new Map;

    /**
     * Available Notes
     */
    private notes: Map<string, Note> = new Map;

    /**
     * FileList visibility switch
     */
    private fileListVisible: boolean = true;

    /**
     * Create a new <glmy-notes /> instance
     */
    constructor() {
        super();
    }

    /**
     * Parse Text, Create Note object
     * @param text 
     */
    public parseTextToNote(filename: string, text: string): Note {
        let match = text.search(/^\-{3,3}(\s+)?(\r\n|\n|\r)/gm);
        if (match <= 0) {
            return {
                title: filename,
                description: '',
                content: text
            };
        }

        let [head, body] = [text.slice(0, match), text.slice(match+4)];
        let result = {
            title: filename,
            description: '',
            content: body
        } as Note;
        for (const line of head.split('\n') as string[]) {
            let pos = line.indexOf(':');
            if (pos < 0) {
                result[line] = true;
            } else {
                let [key, val] = [line.slice(0, pos), line.slice(pos+1)];
                result[key] = val.trim();
            }
        }
        return result;
    }
    
    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.root = this.closest('glmy-app') as GLMY;
        this.index = this.querySelector('night-index') as NightIndex;

        // Handle active Tab
        this.activeTab = this.root.config.session.notes.activeTab;
        for await (const key of this.root.config.session.notes.openTabs) {
            const file = key.startsWith('./') ? key.slice(2) : key.trimLeft();
            const text = await readTextFile(`GLMY/notes/${file}`, {
                dir: BaseDirectory.Document
            });
            const note = this.parseTextToNote(file, text);

            let isActive = this.activeTab === key;
            let tab = this.buildTab(key, note.title, isActive);

            this.tabs.set(key, tab);
            this.notes.set(key, note);
        }

        // Open File
        this.index.addEventListener('open:file', (evt: CustomEventInit) => {
            const path = evt.detail.path;
            if (!path) {
                return;
            }
            this.openTab(path);
        });

        // Add Live Click Listener
        this.addEventListener('click', (evt) => {
            this.onLiveClick(evt);
        });

        // Render
        await this.render();
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        
    }

    /**
     * Open a new Tab
     * @param string
     */
    public async openTab(path: string) {
        const file = path.startsWith('./') ? path.slice(2) : path;
        const text = await readTextFile(`GLMY/notes/${file}`, {
            dir: BaseDirectory.Document
        });
        const note = this.parseTextToNote(file, text);

        let tab = this.buildTab(path, note.title, true);
        this.activeTab = path;

        this.tabs.set(path, tab);
        this.notes.set(path, note);
        
        let tabs = this.querySelector('.tabs') as HTMLUListElement;
        if (tabs.lastElementChild !== null) {
            tabs.lastElementChild.before(tab);
        } else {
            tabs.append(tab);
        }
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
        if (target.matches('[name="create"]')) {
            this.index?.addPlaceholder('/', target.getAttribute('value') as 'file'|'folder');
        }
    }

    /**
     * Build a new Tab Element
     * @param key 
     * @param active 
     */
    private buildTab(key: string, title: string, active: boolean) {
        const tabItem = document.createElement('li');
        tabItem.className = `tab-item${active ? ' active' : ''}`;
        tabItem.dataset.tab = key;
        tabItem.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journal" viewBox="0 0 16 16">
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
            </svg>
            <span class="item-title">${title}</span>
            <button type="button" class="ml-3 -mr-1 toolbar-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
            </button>
        `;
        return tabItem;
    }

    /**
     * Render Component
     */
    public async render() {
        let tabs = this.querySelector('.tabs') as HTMLUListElement;
        if (tabs.lastElementChild !== null) {
            tabs.lastElementChild.before(...this.tabs.values());
        } else {
            tabs.append(...this.tabs.values())
        }

        // Set note content
        if (this.activeTab && this.notes.has(this.activeTab)) {
            let note = this.notes.get(this.activeTab) as Note;
            (this.querySelector('[data-note-title]') as HTMLInputElement).value = note.title;
            (this.querySelector('night-editor') as NightEditor).value = note.content;
        }
    }

}

// Define custom element
window.customElements.define('glmy-notes', GLMYNotes);

// Export Module
export default GLMYNotes;
