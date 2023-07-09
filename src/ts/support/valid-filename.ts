
/**
 * Check if filename is a valid one
 * @param filename 
 * @returns 
 */
function isValidFilename(filename: string) {

    if (/[\0\\\/\:\*\?\"\'\<\>\|]+/.test(filename)) {
        return false;   // Contains an invalid character
    }

    if (/[\r\n\t\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/.test(filename)) {
        return false;   // Contains an invalid whitespace character
    }

    if (/(?:^\s+|\s+$)/.test(filename)) {
        return false;   // Starts or ends with a whitespace
    }

    if (/\W+$/.test(filename)) {
        return false;   // Ends with a non-word-character
    }

    return true;

}

// Export Module
export default isValidFilename;
