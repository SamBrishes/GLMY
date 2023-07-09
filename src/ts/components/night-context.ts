
import { arrow, computePosition, offset } from "@floating-ui/dom";

import AbstractComponent from "../abstract/component";
import wait from "../support/wait";

interface ContextItem {
    label: string;
    icon?: string | HTMLElement | SVGElement;
    danger?: boolean;
    action: ((element: HTMLElement) => void) | null;
}

interface ContextOptions {
    target: HTMLElement;
    items: ContextItem[];
}

class NightContext extends AbstractComponent {

    /**
     * Modal Options
     */
    public options: Required<ContextOptions>;

    /**
     * Abstract class for other FormHandling components
     */
    constructor(options: ContextOptions) {
        super();
        this.options = options;
    }

    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.render();

        await wait(150);
        
        document.body.addEventListener('click', async (event) => {
            if (!this.contains(event.target as HTMLElement)) {
                this.hide();
            }
        });
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        
    }

    /**
     * Show Context Menu
     */
    public async show() {
        if (!document.body.contains(this)) {
            document.body.append(this);
        }
        this.dispatch('show', this);
        
        const arrowElement = this.querySelector('.context-menu-arrow') as HTMLElement;
        const data = await computePosition(this.options.target, this, {
            middleware: [
                arrow({
                    element: arrowElement
                }),
                offset(15)
            ]
        });
        
        this.classList.add('active');
        await wait(10);

        this.style.top = `${data.y}px`;
        this.style.left = `${data.x}px`;
        if (typeof data.middlewareData.arrow !== 'undefined') {
            arrowElement.style.top = `${data.middlewareData.arrow.y}px`;
            arrowElement.style.left = `${data.middlewareData.arrow.x}px`;
        }
        await wait(300);

        this.dispatch('shown', this);
    }

    /**
     * Hide Context Menu
     */
    public async hide() {
        this.dispatch('hide', this);

        this.classList.remove('active');
        await wait(300);
        this.remove();

        this.dispatch('hidden', this);
    }

    /**
     * Render Component
     */
    public async render() {
        let list = document.createElement('ul');
        list.className = 'context-menu';

        for (const item of this.options.items) {
            let li = document.createElement('li');
            li.className = `menu-item${item.danger ? ' item-danger' : ''}`;
            li.addEventListener('click', () => {
                if (item.action !== null) {
                    item.action(li);
                }
            });
            list.append(li);

            if (typeof item.icon !== 'undefined' && item.icon !== null) {
                let icon = document.createElement('span');
                icon.className = 'item-icon';
                
                if (typeof item.icon === 'string') {
                    icon.innerHTML = item.icon;
                } else {
                    icon.append(item.icon);
                }
                li.append(icon)
            }

            let text = document.createElement('span');
            text.className = 'item-label';
            text.innerText = item.label;
            li.append(text);
        }

        let arrow = document.createElement('span');
        arrow.className = 'context-menu-arrow';
        this.append(arrow, list);
    }

}

// Define custom element
window.customElements.define('night-context', NightContext);

// Export Module
export default NightContext;
