
import AbstractComponent from "../abstract/component";
import GLMY from "./glmy-app";

class GLMYSidebar extends AbstractComponent {

    /**
     * Application Root
     */
    private root: GLMY|null = null;

    /**
     * Create a new <glmy-sidebar /> instance
     */
    constructor() {
        super();
    }

    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.root = this.closest('glmy-app') as GLMY;

        // Set current tab
        if (this.root instanceof GLMY) {
            let target = this.root.querySelector(`[data-goto="${this.root.screen}"]`);
            if (target) {
                target.classList.add('active');
            }
        }

        // Change Tab / Screen
        this.addEventListener('click', async (ev) => {
            let target = ev.target as HTMLElement;
            if (target.closest('[data-goto]')) {
                target = target.closest('[data-goto]') as HTMLElement;
            }

            if (!target.matches('[data-goto]')) {
                return;
            }
            await this.changeTab(target.dataset.goto as string);
        });
    }

    /**
     * Change Tab
     */
    private async changeTab(newTab: string) {
        let links = this.querySelectorAll('[data-goto]') as NodeListOf<HTMLElement>;
        if (await this.root?.changeScreen(newTab)) {
            Array.from(links).map(link => {
                if (link.dataset.goto === newTab) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        
    }

    /**
     * Render Component
     */
    public async render() {

    }

}

// Define custom element
window.customElements.define('glmy-sidebar', GLMYSidebar);

// Export Module
export default GLMYSidebar;
