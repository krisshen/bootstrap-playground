import puppeteer from 'puppeteer';
import fs from 'fs';
import { PuppeteerBlocker } from '@cliqz/adblocker-puppeteer';
import fetch from 'cross-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const CONFIG = {
    VIDEOS_PER_CHANNEL: 20,
    MAX_RETRIES: 3,
    INITIAL_WAIT_MS: 5000,
    VIDEO_LOAD_TIMEOUT: 15000,
    RETRY_DELAY_MS: 3000
};

const channels = JSON.parse(fs.readFileSync(path.join(projectRoot, 'data', 'channels.json'))).slice(0, 3);
const channelUrlTemplate = 'https://www.youtube.com/${channel}/videos';
const thumbnailDownloadPath = path.join(projectRoot, 'public', 'img', 'thumbnail');
const fullImgDownloadPath = path.join(projectRoot, 'public', 'img', 'full');
const videoUrlTemplate = 'https://www.youtube.com/watch?v=${videoUrlId}&t=20';
const videoEmbedUrlTemplate = 'https://www.youtube.com/embed/${videoUrlId}';
const DEBUG = false;

// Ensure directories exist
[thumbnailDownloadPath, fullImgDownloadPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const download = async (url, path) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(path, Buffer.from(buffer));
    console.log('✅ Download complete:', path);
};

const getVideoUrlId = (thumbnailImgUrl) => {
    return thumbnailImgUrl.split('?')[0].split('/')[4];
};

async function downloadThumbnail(thumbnailImgUrl, channelId, thumbnailId) {
    const filePath = path.join(thumbnailDownloadPath, `${channelId}_${thumbnailId}.jpeg`);
    await download(thumbnailImgUrl, filePath);
}

async function skipAds(page) {
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            // Check for various ad elements
            const adElements = await page.evaluate(() => {
                const elements = {
                    skipButton: !!document.querySelector('.ytp-ad-skip-button-container'),
                    adOverlay: !!document.querySelector('.ytp-ad-overlay-container'),
                    adText: !!document.querySelector('.ytp-ad-simple-ad-badge'),
                    videoAd: !!document.querySelector('.video-ads.ytp-ad-module')
                };
                return elements;
            });

            if (!adElements.skipButton && !adElements.adOverlay && !adElements.adText && !adElements.videoAd) {
                DEBUG && console.log('No ads detected');
                break;
            }

            // Handle skippable ads
            if (adElements.skipButton) {
                await page.evaluate(() => {
                    const skipButton = document.querySelector('.ytp-ad-skip-button-container');
                    if (skipButton) skipButton.click();
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Handle overlay ads
            if (adElements.adOverlay) {
                await page.evaluate(() => {
                    const closeButton = document.querySelector('.ytp-ad-overlay-close-button');
                    if (closeButton) closeButton.click();
                });
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            DEBUG && console.log('Error in ad handling:', error);
            break;
        }
    }
}

async function waitForVideoToPlay(page) {
    let retries = 0;
    while (retries < CONFIG.MAX_RETRIES) {
        try {
            // Initial wait for video load
            await new Promise(resolve => setTimeout(resolve, CONFIG.INITIAL_WAIT_MS));

            // Wait for video to start playing
            await page.waitForFunction(() => {
                const video = document.querySelector('video');
                return video && 
                       video.readyState >= 3 && // ENOUGH_DATA
                       !video.paused && 
                       video.currentTime > 0;
            }, { timeout: CONFIG.VIDEO_LOAD_TIMEOUT });

            // Check if video is actually playing
            const isPlaying = await page.evaluate(() => {
                const video = document.querySelector('video');
                return video && !video.paused && video.currentTime > 0;
            });

            if (isPlaying) {
                // Additional wait to ensure stable playback
                await new Promise(resolve => setTimeout(resolve, 2000));
                return true;
            }

            retries++;
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
        } catch (error) {
            console.log(`Retry ${retries + 1}/${CONFIG.MAX_RETRIES} - Video load attempt failed`);
            retries++;
            if (retries < CONFIG.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
            }
        }
    }
    return false;
}

async function downloadFullImage(page, videoUrlId, channelId, videoId) {
    const videoUrl = videoUrlTemplate.replace('${videoUrlId}', videoUrlId);
    console.log(`Processing video: ${videoUrl}`);

    let retries = 0;
    while (retries < CONFIG.MAX_RETRIES) {
        try {
            // Navigate to video with increased timeout
            await page.goto(videoUrl, { 
                waitUntil: 'networkidle2',
                timeout: CONFIG.VIDEO_LOAD_TIMEOUT 
            });

            // Wait for player to load
            await page.waitForSelector('.html5-video-player', { timeout: CONFIG.VIDEO_LOAD_TIMEOUT });
            
            // Initial wait for potential ads
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Handle any ads
            await skipAds(page);
            
            // Wait for video to actually start playing
            const isPlaying = await waitForVideoToPlay(page);
            if (!isPlaying) {
                console.log(`Retry ${retries + 1}/${CONFIG.MAX_RETRIES} - Video not playing: ${videoUrl}`);
                retries++;
                continue;
            }

            // Hide player controls and branding
            await page.evaluate(() => {
                const elements = [
                    '.ytp-chrome-bottom',           // Player controls
                    '.ytp-chrome-top',              // Top bar
                    '.branding-img',                // Branding
                    '.ytp-ce-element',              // End cards
                    '.ytp-gradient-bottom',         // Bottom gradient
                    '.ytp-gradient-top',            // Top gradient
                    '.ytp-pause-overlay',           // Pause overlay
                    '.ytp-spinner',                 // Loading spinner
                    '.ytp-cued-thumbnail-overlay',  // Initial thumbnail
                    '.ytp-iv-player-content'        // Annotations
                ];
                
                elements.forEach(selector => {
                    const element = document.querySelector(selector);
                    if (element) element.style.display = 'none';
                });
            });

            // Take screenshot
            const video = await page.$('.html5-video-player');
            if (!video) {
                throw new Error('Video player not found');
            }
            
            const screenshotPath = path.join(fullImgDownloadPath, `${channelId}_${videoId}.jpeg`);
            await video.screenshot({ 
                path: screenshotPath,
                quality: 90
            });
            console.log('✅ Screenshot saved:', screenshotPath);
            return true;
        } catch (error) {
            console.log(`Retry ${retries + 1}/${CONFIG.MAX_RETRIES} - Error:`, error.message);
            retries++;
            if (retries < CONFIG.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
            }
        }
    }
    
    console.log(`❌ Failed to process video after ${CONFIG.MAX_RETRIES} attempts:`, videoUrl);
    return false;
}

const isLiveStream = (thumbnailImgUrl) => thumbnailImgUrl.includes('_live');

async function run() {
    console.log('Starting scraper...');
    
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--autoplay-policy=no-user-gesture-required'
        ],
        headless: 'new'
    });

    const [page] = await browser.pages();
    await page.setViewport({ width: 1920, height: 1080 });

    // Setup ad blocking
    const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
    await blocker.enableBlockingInPage(page);

    // Additional page configurations
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    let videoData = {};
    
    let channelId = 1;
    for (const channel of channels) {
        const videoUrlIds = [];
        const channelUrl = channelUrlTemplate.replace('${channel}', channel.url);
        console.log(`\nProcessing channel: ${channel.name} (${channelUrl})`);
        
        try {
            await page.goto(channelUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            let count = 0;
            const thumbnails = await page.$$('a#thumbnail');

            // Process thumbnails
            for (const thumbnail of thumbnails) {
                try {
                    const thumbnailImgUrl = await thumbnail.$eval('img', img => img.src).catch(() => '');

                    if (!thumbnailImgUrl || await isLiveStream(thumbnailImgUrl)) continue;

                    count += 1;
                    await downloadThumbnail(thumbnailImgUrl, channelId, count);
                    videoUrlIds.push(getVideoUrlId(thumbnailImgUrl));

                    if (count === CONFIG.VIDEOS_PER_CHANNEL) break;
                } catch (error) {
                    console.log(`⚠️ Error processing thumbnail: ${error.message}`);
                    continue;
                }
            }

            // Process full images
            console.log(`\nDownloading full images for channel ${channel.name}...`);
            for (const [index, videoUrlId] of videoUrlIds.entries()) {
                try {
                    await downloadFullImage(page, videoUrlId, channelId, index + 1);
                } catch (error) {
                    console.log(`⚠️ Error downloading full image: ${error.message}`);
                    continue;
                }
            }

            // Store video data
            for (const [index, videoUrlId] of videoUrlIds.entries()) {
                const key = `${channelId}_${index + 1}`;
                videoData[key] = videoEmbedUrlTemplate.replace('${videoUrlId}', videoUrlId);
            }

        } catch (error) {
            console.log(`⚠️ Error processing channel ${channel.name}: ${error.message}`);
        }

        channelId += 1;
    }

    // Write video data
    const videoDataContent = `export default ${JSON.stringify(videoData, null, 2)};`;
    fs.writeFileSync(path.join(projectRoot, 'data', 'loife_videos.js'), videoDataContent);

    await browser.close();
    console.log('\nScraping completed successfully! 🎉');
}

run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
