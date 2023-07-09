import AbstractComponent from "../abstract/component";

class States<T> {

    /**
     * Component State Values
     */
    private values: T;

    /**
     * Component to bind
     */
    private component: AbstractComponent|null = null;

    /**
     * Create a new States value
     * @param initialValues 
     */
    constructor(initialValues: T) {
        this.values = initialValues;
    }

    /**
     * Check if a state exists.
     * @param key 
     * @returns 
     */
    public has(key: keyof T) {
        return typeof this.values[key] !== 'undefined';
    }

    /**
     * Get State value
     * @param key 
     * @returns 
     */
    public get(key: keyof T) {
        return this.values[key];
    }

    /**
     * Set State value
     * @param key 
     * @param value 
     */
    public set(key: keyof T, value: any) {
        let oldValue = this.values[key];
        if (typeof oldValue !== 'string' && typeof oldValue !== 'number' && typeof oldValue !== 'boolean') {
            oldValue = structuredClone(oldValue);
        }

        let newValue = value;
        if (typeof newValue !== 'string' && typeof newValue !== 'number' && typeof newValue !== 'boolean') {
            newValue = structuredClone(newValue);
        }

        // Change value and trigger callback
        this.values[key] = value;
        if (this.component) {
            this.component.onStateChanged(key as string, newValue, oldValue);
        }
    }

    /**
     * Bind component
     * @param component 
     */
    public bind(component: AbstractComponent) {
        if (this.component !== null) {
            throw new Error('You cannot bind another component to this states object.');
        }
        this.component = component;
    }

}

// Export Module
export default States;
