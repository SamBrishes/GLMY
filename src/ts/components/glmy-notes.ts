
import AbstractComponent from '../abstract/component';
import States from '../extensions/states';
import GLMY from './glmy-app';
import NightEditor from './night-editor';
import NightIndex from './night-index';
import wait from '../support/wait';
import FileSystem from '../plugins/filesystem';

interface GLMYNotesStates {
    activeTab: string|null;
    showFileList: boolean;
};

interface Note {
    title: string;
    description: string;
    content: string;
    [key: string|number]: any;
};

interface NoteTab {
    note: Note;
    tab: HTMLLIElement;
    editor: NightEditor;
};

class GLMYNotes extends AbstractComponent {

    /**
     * Application Root
     */
    private root: GLMY|null = null;

    /**
     * Component Index
     */
    private index: NightIndex|null = null;

    /**
     * Available Editor NoteTabs
     */
    private notes: Map<string, NoteTab> = new Map;

    /**
     * FileSystem instance
     */
    private fileSystem: FileSystem;

    /**
     * Component States
     */
    public states: States<GLMYNotesStates> = new States({
        activeTab: null,
        showFileList: true,
    });

    /**
     * Create a new GLMYNotes component instance
     */
    constructor() {
        super();
        this.fileSystem = new FileSystem('notes');
    }
    
    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.root = this.closest('glmy-app') as GLMY;
        this.index = this.querySelector('night-index') as NightIndex;

        // Open session tabs
        for await (const key of this.root.config.session.notes.openTabs) {
            await this.openTab(key);
        }

        // Open File
        this.index.addEventListener('open:file', (evt: CustomEventInit) => {
            let path = evt.detail.path;
            if (!path) {
                return;
            }

            if (path.startsWith('/')) {
                path = path.slice(1);
            }

            if (this.notes.has(path)) {
                this.switchTab(path);
            } else {
                this.openTab(path, true);
            }
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
     * Callback for changed states
     * @param key 
     * @param newValue 
     * @param oldValue 
     */
    public async onStateChanged(key: keyof GLMYNotesStates, newValue: any, oldValue: any) {
        if (key === 'showFileList') {
            this.classList[newValue ? 'remove' : 'add']('hide-sidebar');
            return;
        }

        if (key === 'activeTab') {
            if (oldValue && this.notes.has(oldValue)) {
                let oldTab = this.notes.get(oldValue) as NoteTab;
                oldTab.tab.classList.remove('active');
            }

            if (this.notes.has(newValue)) {
                let tab = this.notes.get(newValue) as NoteTab;
                tab.tab.classList.add('active');
                
                if (this.querySelector('night-editor')) {
                    this.querySelector('night-editor')?.remove()
                }
                this.querySelector('main')?.append(tab.editor);
            }
        }
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
     * Read Note
     * @param file 
     * @returns 
     */
    public async readNote(file: string): Promise<Note> {
        if (!(await this.fileSystem.exists(file))) {
            throw new Error('The passed note does not exist.');
        }

        const text = await this.fileSystem.readFile(file);
        if (text !== false) {
            return this.parseTextToNote(file, text);
        } else {
            throw new Error('The passed note does not exist.');
        }
    }

    /**
     * Open Tab
     * @param key 
     */
    public async openTab(key: string, setActive: boolean = false) {
        const note = await this.readNote(key);
        const tab = this.renderTab(key, note, setActive);
        const editor = new NightEditor({
            title: note.title,
            content: note.content
        });

        this.notes.set(key, {
            note,
            tab,
            editor
        });
        if (setActive) {
            this.states.set('activeTab', key);
        }

        let tabs = this.querySelector('.tabs') as HTMLUListElement;
        if (tabs.children.length > 0) {
            tabs.lastElementChild?.before(tab);
        } else {
            tabs.append(tab);
        }
    }

    /**
     * Switch Tab
     * @param key 
     */
    public async switchTab(key: string) {
        if (!this.notes.has(key)) {
            throw new Error('The passed tab does not exist.');
        }
        this.states.set('activeTab', key);
    }

    /**
     * Close Tab
     * @param key 
     */
    public async closeTab(key: string): Promise<boolean> {
        if (!this.notes.has(key)) {
            return false;
        }
        let tab = this.notes.get(key) as NoteTab;

        // Find another tab to select
        let otherTab = null;
        if (tab.tab.classList.contains('active')) {
            if (tab.tab.previousElementSibling && tab.tab.previousElementSibling.matches('[data-tab]')) {
                otherTab = this.notes.get((tab.tab.previousElementSibling as any).dataset.tab);
            } else if (tab.tab.nextElementSibling && tab.tab.nextElementSibling.matches('[data-tab]')) {
                otherTab = this.notes.get((tab.tab.nextElementSibling as any).dataset.tab);
            }
        }

        // Remove Tab
        tab.tab.remove();
        tab.editor.remove();
        this.notes.delete(key);

        // Select another Tab
        if (otherTab) {
            await this.switchTab(otherTab.tab.dataset.tab as any);
        }
        return true;
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
            this.index?.addPlaceholder('/', target.getAttribute('value') as 'file'|'directory');
        }

        if (target.matches('[name="action"]')) {
            if ((target as HTMLButtonElement).value === 'filelist') {
                this.states.set('showFileList', !this.states.get('showFileList'));
            }

            let tab = target.closest('[data-tab]') as HTMLElement|null;
            if (tab === null) {
                return;
            }
            if ((target as HTMLButtonElement).value === 'close') {
                await this.closeTab(tab.dataset.tab as string);
            }
        }
    }

    /**
     * Render Component
     */
    public async render() {
        if (this.root) {
            await wait(20);
            this.states.set('activeTab', this.root.config.session.notes.activeTab);
        }
    }

    /**
     * Build a new Tab Element
     * @param key 
     * @param note
     * @param active
     * @returns
     */
    private renderTab(key: string, note: Note, active: boolean): HTMLLIElement {
        const tabItem = document.createElement('li');
        tabItem.className = `tab-item${active ? ' active' : ''}`;
        tabItem.dataset.tab = key;
        tabItem.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-journal" viewBox="0 0 16 16">
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
            </svg>

            <span class="item-title">${note.title}</span>

            <button type="button" class="ml-3 -mr-1 toolbar-btn" name="action" value="close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
            </button>
        `;
        tabItem.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            if (target.matches('[name="action"][value="close"]') || target.closest(('[name="action"][value="close"]'))) {
                return;
            }
            await this.switchTab(key);
        });
        return tabItem;
    }

}

// Define custom element
window.customElements.define('glmy-notes', GLMYNotes);

// Export Module
export default GLMYNotes;
