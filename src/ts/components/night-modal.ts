import AbstractComponent from "../abstract/component";
import wait from "../support/wait";

interface ModalOptions {
    title?: string;
    content?: string | HTMLElement;

    header?: HTMLElement | ((modal: NightModal) => HTMLElement) | null;
    body?: HTMLElement | ((modal: NightModal) => HTMLElement) | null;
    footer?: HTMLElement | ((modal: NightModal) => HTMLElement) | null;

    backdrop?: boolean;
};

interface ConfirmOptions {
    ok: string;
    okColor: string;
    cancel: string;
    cancelColor: string;
};

class NightModal extends AbstractComponent {

    /**
     * Default Options
     */
    public static DEFAULTS: Required<ModalOptions> = {
        title: '',
        content: '',
        header: null,
        body: null,
        footer: null,
        backdrop: true
    };

    /**
     * Create a confirm modal
     * @param title 
     * @param content 
     * @param options 
     */
    public static async confirm(title: string, content: string, options: Partial<ConfirmOptions> = {}): Promise<boolean> {
        return new Promise(resolve => {
            let modal = new NightModal({
                title,
                content,
                footer: () => {
                    let cancel = document.createElement('button');
                    cancel.type = 'button';
                    cancel.className = `btn btn-modal ${options.cancelColor || 'btn-gray outlined'}`;
                    cancel.innerText = options.cancel || 'Cancel';
                    cancel.addEventListener('click', async () => {
                        resolve(false);
                        await modal.hide();
                    });

                    let okay = document.createElement('button');
                    okay.type = 'button';
                    okay.className = `btn btn-modal ${options.okColor || 'btn-success'}`;
                    okay.innerText = options.ok || 'Ok';
                    okay.addEventListener('click', async () => {
                        resolve(true);
                        await modal.hide();
                    });
    
                    let footer = document.createElement('footer');
                    footer.className = 'dialog-footer';
                    footer.append(okay, cancel);
                    return footer;
                }
            });

            modal.on('hidden', () => {
                resolve(false);
            })
            modal.show();
        });
    }

    /**
     * Modal Options
     */
    public options: Required<ModalOptions>;

    /**
     * Create a new NightModal component instance
     * @param options
     */
    constructor(options: ModalOptions) {
        super();
        this.options = Object.assign({}, NightModal.DEFAULTS, options);
    }

    /**
     * Get Visibility State
     */
    get visible(): boolean {
        return this.hasAttribute('visible');
    }

    /**
     * Set Visibility State
     */
    set visible(value: boolean) {
        if (value) {
            this.setAttribute('visible', '');
        } else {
            this.removeAttribute('visible');
        }
    }

    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.dispatch('connected');

        this.render();
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        this.dispatch('disconnected');
    }

    /**
     * Toggle Modal
     */
    public toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show Modal
     */
    public async show() {
        this.dispatch('show');

        document.body.append(this);
        await wait(10);
        this.visible = true;
        await wait(300);

        this.dispatch('shown');
    }

    /**
     * Hide Modal
     */
    public async hide() {
        this.dispatch('hide');

        this.visible = false;
        await wait(300);
        this.remove();
        await wait(10);

        this.dispatch('hidden');
    }

    /**
     * Render Component
     */
    public async render() {
        if (this.options.backdrop) {
            this.classList.add('backdrop');
        } else {
            this.classList.remove('backdrop');
        }

        // Create header
        let header;
        if (typeof this.options.header === 'function') {
            header = this.options.header(this);
        } else if (this.options.header instanceof HTMLElement) {
            header = this.options.header;
        } else {
            header = this.renderHeader();
        }

        // Create body
        let content;
        if (typeof this.options.body === 'function') {
            content = this.options.body(this);
        } else if (this.options.body instanceof HTMLElement) {
            content = this.options.body;
        } else {
            content = this.renderBody();
        }

        // Create Footer
        let footer;
        if (typeof this.options.footer === 'function') {
            footer = this.options.footer(this);
        } else if (this.options.footer instanceof HTMLElement) {
            footer = this.options.footer;
        } else {
            footer = this.renderFooter();
        }

        // Create Dialog
        let dialog = document.createElement('div');
        dialog.className = 'dialog';
        this.append(dialog);
        
        if (header instanceof HTMLElement) {
            dialog.append(header);
        }
        if (content instanceof HTMLElement) {
            dialog.append(content);
        }
        if (footer instanceof HTMLElement) {
            dialog.append(footer);
        }
    }

    /**
     * Render Modal Header
     */
    public renderHeader() {
        let content = document.createElement('header');
        content.className = 'dialog-header';
        content.innerHTML = `<div class="dialog-title">${this.options.title}</div>`;
        return content;
    }

    /**
     * Render Modal Body
     */
    public renderBody() {
        let content = document.createElement('article');
        content.className = 'dialog-body';
        if (typeof this.options.content === 'string') {
            content.innerHTML = `<p>${this.options.content}</p>`;
        } else if (this.options.content instanceof HTMLElement) {
            content.append(this.options.content);
        }
        return content;
    }

    /**
     * Render Modal Footer
     */
    public renderFooter() {
        let content = document.createElement('article');
        content.className = 'dialog-footer';
        return content;
    }

}

// Define custom element
window.customElements.define('night-modal', NightModal);

// Export Module
export default NightModal;
