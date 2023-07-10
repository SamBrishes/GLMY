
type Return<T> = T;

interface Properties {
    [key: string]: string|object;
};


/**
 * Create Element
 * @param tagName 
 * @returns 
 */
function create<T>(tagName: string, props?: Properties): Return<T> {
    const element = document.createElement(tagName) as T;

    if (typeof props !== 'undefined') {
        for(const [prop, value] of Object.entries(props)) {
            if (prop === 'dataset' || prop === 'style') {
                for (const [key, val] of Object.entries(value)) {
                    (element as any)[prop][key] = val;
                }
            } else {
                (element as any)[prop] = value;
            }
        }
    }

    return element;
}

// Export Module
export default create;
