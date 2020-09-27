import puppeteer from 'puppeteer';
import fs from 'fs';
import request from 'request';
import adBlocker from '@cliqz/adblocker-puppeteer';
import fetch from 'cross-fetch';

const {PuppeteerBlocker} = adBlocker;

const channels = [
    'channel/UCq22aK0t0mrOEq676Be4ezw',
    'channel/UC2fVSthyWxWSjsiEAHPzriQ',
    'c/ChilledCow',
];
const channelUrlTemplate = 'https://www.youtube.com/${channel}/videos';

const videosPerChannel = 20;
const thumbnailDownloadPath = './loife/img/thumbnail/';
const fullImgDownloadPath = './loife/img/full/';
const videoUrlTemplate = 'https://www.youtube.com/watch?v=${videoUrlId}&t=20';
const videoEmbedUrlTemplate = 'https://www.youtube.com/embed/${videoUrlId}';
let thumbnailImgUrl
let channelUrl
let data = "let videos = {\n";

const download = async (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

/**
 * crop thumbnailImgUrl and return video id.
 *
 * @param thumbnailImgUrl, sample: https://i.ytimg.com/vi/mPOLrO68sUE/hqdefault.jpg?sqp=-oaymwEZCPYBEIoBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLA_NqYyDL3b-CsfxWyNdLjgtOQZOQ
 * @returns {string}: 'mPOLrO68sUE' is what it returns in this case
 */
function getVideoUrlId(thumbnailImgUrl) {
    return thumbnailImgUrl.split('?')[0].split('/')[4];
}

async function downloadThumbnail(thumbnailImgUrl, channelId, thumbnailId) {
    await download(thumbnailImgUrl, thumbnailDownloadPath + channelId + '_' + thumbnailId + '.jpeg', () => {
        console.log(`✅ Download Done!`);
    });
}

async function skipAds(page) {
    let skipAdsButtonSelector = '.ytp-ad-skip-button.ytp-button';

    let skipAdsButton;

    await page.waitForTimeout(1000);
    skipAdsButton = await page.$(skipAdsButtonSelector);
    if (skipAdsButton !== null) {
        // console.log(`found skip ads button element by class ${skipAdsButtonSelector}.`);
        skipAdsButton.click();
        // console.log(`button clicked.`);
        await page.waitForTimeout(2000);
    } else {
        // console.log(`didn't see button element: ${skipAdsButtonSelector}`)
    }
}

async function downloadFullImage(page, videoUrlId, channelId, videoId) {
    let videoUrl = videoUrlTemplate.replace('${videoUrlId}', videoUrlId);
    console.log(`videoUrl: ${videoUrl}`);

    await page.goto(videoUrl, {waitUntil: 'networkidle2'});
    await page.waitForSelector('.html5-video-player');
    const video = await page.$('.html5-video-player');
    await page.evaluate(() => {
        // Hide youtube player controls.
        let dom = document.querySelector('.ytp-chrome-bottom')
        if (dom !== null) {
            dom.style.display = 'none'
        }
    })

    await skipAds(page);

    await video.screenshot({path: `${fullImgDownloadPath}${channelId}_${videoId}.jpeg`});
}

/**
 * Live steam thumbnailImgUrl has 'hqdefault_live.jpg'
 * sample: https://i.ytimg.com/vi/9Q_APT73zDQ/hqdefault_live.jpg?xxx
 *
 * @param thumbnailImgUrl
 * @returns {Promise<boolean>}
 */
async function isLiveStream(thumbnailImgUrl) {
    return thumbnailImgUrl.includes('_live');
}

async function run() {

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox',],
        // headless: false
    })
    console.log('start...')
    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1080})

    PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        blocker.enableBlockingInPage(page);
    });

    let channelId = 1;
    for (const channel of channels) {
        let videoUrlIds = [];
        channelUrl = channelUrlTemplate.replace('${channel}', channel);
        console.log(`checking at channel: ${channelUrl}`);
        await page.goto(channelUrl, {waitUntil: 'networkidle2'});
        // await page.screenshot({path: 'test.jpeg'});

        let count = 0;
        const thumbnails = await page.$$('a#thumbnail');

        // download thumbnails
        for (const thumbnail of thumbnails) {
            thumbnailImgUrl = await thumbnail.$eval('img', thumbnailImg => thumbnailImg.src);

            // skip Live streams as puppeteer doesn't support it at the moment
            if (await isLiveStream(thumbnailImgUrl)) continue;

            count += 1
            await downloadThumbnail(thumbnailImgUrl, channelId, count);

            videoUrlIds.push(getVideoUrlId(thumbnailImgUrl));

            if (count === videosPerChannel) {
                console.log('complete one channel');
                break;
            }
        }

        // download full images
        for (const [index, videoUrlId] of videoUrlIds.entries()) {
            await downloadFullImage(page, videoUrlId, channelId, index + 1);
        }

        // append to data
        for (const [index, videoUrlId] of videoUrlIds.entries()) {
            data += `    "${channelId}_${index + 1}": "${videoEmbedUrlTemplate.replace('${videoUrlId}', videoUrlId)}",\n`;
        }

        channelId += 1;
    }

    // write data to loife_videos.js
    data += "};";
    console.log(data);
    fs.writeFile('./loife/data/loife_videos.js', data, () => {
    });

    await browser.close();
    console.log('done!')
}

run();