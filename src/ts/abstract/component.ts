
import States from "../extensions/states";

abstract class AbstractComponent extends HTMLElement {

    /**
     * Form Association
     */
    static formAssociated = false;

    /**
     * Observed Attributes
     */
    static get observedAttributes() {
        return [];
    }

    /**
     * Component States
     */
    public states: States<any>|null = null;

    /**
     * Abstract class for other FormHandling components
     */
    constructor() {
        super();

        if (this.constructor.name === 'AbstractComponent') {
            throw new Error('AbstractComponent is an abstract class and cannot be used directly.');
        }

        // Lazy initialization
        setTimeout(() => {
            if (this.states) {
                this.states.bind(this);
            }
        }, 10)
    }

    /**
     * Observed attribute has been changed
     * @param name 
     * @param oldValue 
     * @param newValue 
     */
    public attributeChangedCallback(name: string, oldValue: any, newValue: any) {
        if (oldValue === newValue) {
            return;
        }
    }

    /**
     * Connected Callback
     */
    public async connectedCallback() {
        
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
    public async onStateChanged(key: string, newValue: any, oldValue: any) {
        
    }

    /**
     * Add Event Listener
     * @param event 
     * @param callback 
     */
    public on(event: string, callback: EventListener) {
        this.addEventListener(event, callback);
    }

    /**
     * Remove Event Listener
     * @param event 
     * @param callback 
     */
    public off(event: string, callback: EventListener) {
        this.removeEventListener(event, callback);
    }

    /**
     * Dispatch an Event
     * @param event 
     * @param details 
     * @param options 
     * @returns 
     */
    public dispatch(event: string, details?: any, options?: EventInit): boolean {
        if (typeof options === 'undefined') {
            options = {};
        }

        const evt = new CustomEvent(event, {
            bubbles: options.bubbles || false,
            cancelable: options.cancelable  || false,
            composed: options.composed ||false,
            detail: details || null
        });
        return this.dispatchEvent(evt);
    }

    /**
     * Render Component
     */
    public async render() {
        // Overwrite by real component
    }

}

// Export Module
export default AbstractComponent;
