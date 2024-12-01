/**
 * Sanitizes and validates YouTube video URLs
 * @param {string} url - The YouTube embed URL to validate
 * @returns {string|null} - Returns sanitized URL or null if invalid
 */
export function sanitizeVideoUrl(url) {
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
export function validateImageId(id) {
  if (!id || typeof id !== 'string') return false;
  // Check if ID matches pattern like "1_1", "1_2", etc.
  return /^\d+_\d+$/.test(id);
}

/**
 * Generate random numbers for video selection
 * @param {number} size - Number of videos to select
 * @returns {number[]} - Array of random numbers
 */
export function generateRandomNumbers(size) {
  const numbers = new Set();
  while (numbers.size < size) {
    const chapter = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const lesson = Math.floor(Math.random() * 20) + 1; // 1 to 20
    const key = `${chapter}_${lesson}`;
    numbers.add(key);
  }
  return Array.from(numbers).map(key => {
    const [chapter, lesson] = key.split('_').map(Number);
    return [chapter, lesson];
  });
}

/**
 * Convert numbers to image IDs
 * @param {number[]} numbers - Array of numbers
 * @returns {string[]} - Array of image IDs
 */
export function getImageIds(numbers) {
  return numbers.map(([chapter, lesson]) => `${chapter}_${lesson}`);
}
