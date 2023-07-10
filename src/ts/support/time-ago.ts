
/**
 * Calculate time ago
 * @source https://stackoverflow.com/a/3177838
 * @param timestamp 
 * @returns 
 */
function timeAgo(timestamp: number) {
    var seconds = Math.floor((Date.now() - timestamp) / 1000);
    var interval = seconds / 31536000;
  
    if (interval > 1) {
        return Math.floor(interval) + " years";
    }

    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months";
    }

    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days";
    }

    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours";
    }

    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

// Export Module
export default timeAgo;
