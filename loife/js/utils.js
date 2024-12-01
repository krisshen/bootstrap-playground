// Utility functions for security and validation

/**
 * Sanitizes and validates YouTube video URLs
 * @param {string} url - The YouTube embed URL to validate
 * @returns {string|null} - Returns sanitized URL or null if invalid
 */
function sanitizeVideoUrl(url) {
    try {
        const validUrl = new URL(url);
        // Only allow YouTube embeds
        if (!validUrl.hostname.includes('youtube.com') || !validUrl.pathname.includes('/embed/')) {
            console.error('Invalid video URL detected:', url);
            return null;
        }
        // Ensure HTTPS
        validUrl.protocol = 'https:';
        return validUrl.toString();
    } catch (e) {
        console.error('Invalid URL format:', e);
        return null;
    }
}

/**
 * Validates image ID format
 * @param {string} id - The image ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
function validateImageId(id) {
    return /^\d+_\d+$/.test(id);
}

// Export utilities
window.loifeUtils = {
    sanitizeVideoUrl,
    validateImageId
};
