
class NightFormControl extends HTMLElement {

    /**
     * Enable Form Association
     */
    static formAssociated = true;

    /**
     * Internal Element attributes
     */
    public _internals: ElementInternals;

    /**
     * Internal form control tag
     */
    public _type: string = 'input';

    /**
     * Abstract class for other FormHandling components
     */
    constructor() {
        super();
        this._internals = this.attachInternals();

        if (this.constructor.name === 'NightFormControl' || this.localName === 'night-form-control') {
            throw new Error('NightFormControl is an abstract class and cannot be instantiated directly.');
        }
    }

    /**
     * Returns the form owner of internals's target element.
     * @note required for form association
     * @returns
     */
    get form(): HTMLFormElement|null {
        return this._internals.form;
    }

    /**
     * Returns the internal target input tag name.
     * @note required for form association
     * @returns
     */
    get type(): string {
        return this._type;
    }


    /**
     * Returns the ValidityState object for internals's target element.
     * @note required for form association
     * @returns
     */
    get validity(): ValidityState {
        return this._internals.validity;
    }

    /**
     * Returns the error message that would be shown to the user if internals's target element was to
     * be checked for validity.
     * @note required for form association
     * @returns
     */
    get validationMessage(): string {
        return this._internals.validationMessage;
    }

    /**
     * Returns true if internals's target element will be validated when the form is submitted; 
     * false otherwise.
     * @note required for form association
     * @returns
     */
    get willValidate(): boolean {
        return this._internals.willValidate;
    }

    /**
     * Returns true if internals's target element has no validity problems; false otherwise. Fires 
     * an invalid event at the element in the latter case.
     * @note required for form association
     * @returns 
     */
    public checkValidity() {
        return this._internals.checkValidity();
    }

    /**
     * Returns true if internals's target element has no validity problems; otherwise, returns false, 
     * fires an invalid event at the element, and (if the event isn't canceled) reports the problem 
     * to the user.
     * @note required for form association
     * @returns 
     */
    public reportValidity() {
        return this._internals.reportValidity();
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
        // Makes CustomComponent focusable
        if (!this.hasAttribute('tabindex')) {
            this.setAttribute('tabindex', '0');
            this.tabIndex = 0;
        }
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
        
    }

}

// Export Module
export default NightFormControl;
