
class GLMYError extends Error {

    /**
     * Error Details
     */
    public details: { [key: string]: any } | null = null;

    /**
     * Create a new GLMYError
     * @param message 
     * @param details 
     * @param params 
     */
    constructor(message: string, details?: { [key: string]: any } | null, ...params: any) {
        super(message, ...params);

        this.name = 'GLMYError';
        this.details = details || null;
    }

}

// Export Module
export default GLMYError;
