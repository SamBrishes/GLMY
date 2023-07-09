
import { arrow, computePosition, offset } from "@floating-ui/dom";
import wait from "../support/wait";
import AbstractComponent from "../abstract/component";

interface TooltipOptions {
    text: string;
    duration?: number;
}

class NightTooltip extends AbstractComponent {

    /**
     * Default Options
     */
    public static DEFAULTS: Required<TooltipOptions> = {
        text: '',
        duration: -1
    };

    /**
     * Tooltip Target Element
     */
    public target: HTMLElement;

    /**
     * Tooltip Options
     */
    public options: Required<TooltipOptions>;

    /**
     * Create a new NightTooltip component
     * @param target
     * @param options
     */
    constructor(target: HTMLElement, options: TooltipOptions) {
        super();
        this.target = target;
        this.options = Object.assign({}, NightTooltip.DEFAULTS, options);
    }

    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.render();

        if (typeof this.options.duration === 'number' && this.options.duration > 0) {
            setTimeout(() => this.hide(), this.options.duration);
        }
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        
    }

    /**
     * Show Tooltip
     */
    public async show() {
        if (!document.body.contains(this)) {
            document.body.append(this);
        }

        const data = await computePosition(this.target, this, {
            middleware: [
                offset(10)
            ]
        });
        
        this.classList.add('visible');
        await wait(10);

        this.style.top = `${data.y}px`;
        this.style.left = `${data.x}px`;
        await wait(300);
    }

    /**
     * Hide Tooltip
     */
    public async hide() {
        this.classList.remove('visible');
        await wait(300);
        this.remove();
    }

    /**
     * Render Component
     */
    public async render() {
        this.innerText = `${this.options.text}`;
    }

}

// Define custom element
window.customElements.define('night-tooltip', NightTooltip);

// Export Module
export default NightTooltip;
