
import { invoke } from '@tauri-apps/api/tauri';
import { readDir, BaseDirectory, exists, createDir, writeFile, readTextFile, writeTextFile } from '@tauri-apps/api/fs';
import Storage from '../plugins/storage';
import GLMYSidebar from './glmy-sidebar';
import GLMYError from '../plugins/glmy-error';
import AbstractComponent from '../abstract/component';


type RustErrorResponse = {
    status: 'error';
    message: string;
    details?: { [key: string]: any };
    request?: {
        method: string;
        args: { [key: string]: any };
    };
};

type RustSuccessResponse = {
    status: 'success';
    result: { [key: string]: any };
    details?: { [key: string]: any };
};

type RustResponse = RustErrorResponse | RustSuccessResponse;

class GLMY extends AbstractComponent {

    /**
     * Default configuration
     */
    public static DEFAULTS = {
        version: "0.1.0",
        session: {
            activePage: "notes",
            notes: {
                activeTab: "./start.md",
                openTabs: [
                    "./start.md"
                ]
            }
        },
        labels: {}
    };

    /**
     * StartHere Text
     */
    public static introductionText(): string {
        let content = 'title: Welcome to GLMY\n'
                    + 'description: Simple introduction text.\n'
                    + '---\n'
                    + 'Welcome to [GLMY](https://glmy.rat.md).\n\n'
                    + 'Start your new **awesome** adventure right here!\n\n'
                    + '_~~~ GLMY_';
        return content;
    };

    /**
     * Application Storage
     */
    public storage: Storage;

    /**
     * Application Configuration
     */
    public config: { [key: string]: any } = {};

    /**
     * Application Sidebar
     */
    public sidebar: GLMYSidebar|null = null;

    /**
     * Active Screen
     */
    public screen: string = 'notes';

    /**
     * Create a new <glmy-editor /> instance
     */
    constructor() {
        super();

        this.storage = new Storage('glmy', localStorage);
    }

    /**
     * Request / Call a Rust method
     * @param method 
     * @param args 
     * @returns 
     */
    public async request(method: string, args: { [key: string]: any } = {}): Promise<RustResponse> {
        let result;
        try {
            let response = await invoke('initialize', { ...args });
            if (typeof response !== 'string') {
                throw new GLMYError('The received response is invalid.', {
                    response
                });
            }

            let temp = JSON.parse(response);
            if (typeof temp.status !== 'string') {
                throw new GLMYError('The received response is corrupt.', {
                    response
                });
            }
            if (temp.status !== 'success') {
                throw new GLMYError(temp.message || '', {
                    response
                });
            } else {
                result = temp;
            }
        } catch (err) {
            let message = 'An unknown error occurred';
            if (err instanceof Error) {
                message = err.message;
            } else if (typeof (err as any).toString === 'function') {
                message = (err as any).toString();
            }

            let details = err instanceof GLMYError ? err.details : {};
            result = {
                status: 'error',
                message,
                details,
                request: {
                    method,
                    args
                }
            } as RustErrorResponse;
        }

        return result;
    }

    /**
     * Request Page Content
     * @param page 
     * @returns 
     */
    public async requestPage(page: string) {
        page = page.endsWith('.html') ? page : `${page}.html`;
        let request = await fetch(`src/pages/${page}`);
        let response = await request.text();
        return response;
    }

    /**
     * Initialize GLMY Application
     */
    public async initialize() {
        let rootExists = await exists('GLMY', {
            dir: BaseDirectory.Document
        });

        // Create root directory
        if (!rootExists) {
            await createDir('GLMY', {
                dir: BaseDirectory.Document
            });
        }

        // Create application directories
        if (!await exists('GLMY/bookmarks', { dir: BaseDirectory.Document })) {
            await createDir('GLMY/bookmarks', { dir: BaseDirectory.Document });
        }
        if (!await exists('GLMY/databases', { dir: BaseDirectory.Document })) {
            await createDir('GLMY/databases', { dir: BaseDirectory.Document });
        }
        if (!await exists('GLMY/notes', { dir: BaseDirectory.Document })) {
            await createDir('GLMY/notes', { dir: BaseDirectory.Document });
        }
        if (!await exists('GLMY/snippets', { dir: BaseDirectory.Document })) {
            await createDir('GLMY/snippets', { dir: BaseDirectory.Document });
        }
        if (!await exists('GLMY/temp', { dir: BaseDirectory.Document })) {
            await createDir('GLMY/temp', { dir: BaseDirectory.Document });
        }
        if (!await exists('GLMY/todos', { dir: BaseDirectory.Document })) {
            await createDir('GLMY/todos', { dir: BaseDirectory.Document });
        }

        // Create first Note
        if (!rootExists) {
            await writeTextFile('GLMY/notes/start.md', GLMY.introductionText(), {
                dir: BaseDirectory.Document
            });
        }

        // Read config file
        let configExists = await exists('GLMY/config.json', {
            dir: BaseDirectory.Document
        });

        // Read or Create config file
        let config;
        if (!configExists) {
            config = GLMY.DEFAULTS;
            await writeTextFile('GLMY/config.json', JSON.stringify(config), {
                dir: BaseDirectory.Document
            });
        } else {
            config = await readTextFile('GLMY/config.json', {
                dir: BaseDirectory.Document
            });
            config = JSON.parse(config);
        }
        this.config = config;
    }
    
    /**
     * Connected Callback
     */
    public async connectedCallback() {
        try {
            await this.initialize();
        } catch (e) {
            console.error(e);
            return;
        }
        this.screen = this.config.session.activePage;

        // Request Sidebar
        let sidebar = await this.requestPage('sidebar');
        let temp = document.createElement('DIV');
        temp.innerHTML = sidebar;
        this.sidebar = temp.querySelector('glmy-sidebar') as GLMYSidebar;

        // Render Component
        this.render();
    }

    /**
     * Change current Screen
     * @param screen 
     */
    public async changeScreen(screen: string): Promise<boolean> {
        this.screen = screen;
        await this.render();
        return true;
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        
    }

    /**
     * Render Application
     */
    public async render() {
        if (this.sidebar && this.sidebar.parentElement !== this) {
            this.appendChild(this.sidebar);
        }

        // Render Page
        let content = await this.requestPage(`page-${this.screen}`);
        let temp = document.createElement('DIV');
        temp.innerHTML = content;

        // Replace or Set Page
        if (this.querySelector('.screen')) {
            (this.querySelector('.screen') as HTMLElement).replaceWith(temp.querySelector('.screen') as HTMLElement);
        } else {
            this.appendChild(temp.querySelector('.screen') as HTMLElement);
        }
    }

}

// Define custom element
window.customElements.define('glmy-app', GLMY);

// Export Module
export default GLMY;
