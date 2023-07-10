
import { arrow, computePosition, offset } from "@floating-ui/dom";

import AbstractComponent from "../abstract/component";
import wait from "../support/wait";

interface ContextItem {
    label: string;
    icon?: string | HTMLElement | SVGElement;
    danger?: boolean;
    action: ((contextMenu: NightContext, element: HTMLElement) => void) | null;
}

interface ContextOptions {
    items: ContextItem[];
}

class NightContext extends AbstractComponent {

    /**
     * Context Target Element
     */
    public target: HTMLElement;

    /**
     * Context Options
     */
    public options: Required<ContextOptions>;

    /**
     * Click Outside Event Handler
     */
    private onClickOutsideHandler: (this: NightContext, event: Event) => void;

    /**
     * Create a new NightContext component instance
     * @param target 
     * @param options 
     */
    constructor(target: HTMLElement, options: ContextOptions) {
        super();
        this.target = target;
        this.options = options;
        this.onClickOutsideHandler = this.onClickOutside.bind(this);
    }

    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.render();

        await wait(150);
        
        document.body.addEventListener('click', this.onClickOutsideHandler);
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        document.body.removeEventListener('click', this.onClickOutsideHandler);
    }

    /**
     * Click Outside EventListener
     * @param event
     */
    public async onClickOutside(event: Event) {
        if (event.target === this || this.contains(event.target as HTMLElement)) {
            return;
        }
        await this.hide();
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
        const data = await computePosition(this.target, this, {
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

        this.dispatch('hidden', this);
        this.remove();
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
                    item.action(this, li);
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
