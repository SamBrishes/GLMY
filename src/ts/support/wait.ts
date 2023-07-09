
/**
 * Wait Handler
 * @param {number} time The number of ms to wait.
 * @param {number} steps The number of ms to wait for the timeout function.
 * @returns {Promise}
 */
function wait(time: number, steps: number = 10): Promise<null> {
    let now = Date.now();
    return new Promise(resolve => {
        const waiter = () => {
            if (Date.now() - now >= time) {
                resolve(null);
            } else {
                setTimeout(waiter, steps);
            }
        };
        setTimeout(waiter, steps);
    });
}

// Export Module
export default wait;
