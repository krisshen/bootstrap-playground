import puppeteer from 'puppeteer';
import fs from 'fs';
import request from 'request';
import pkg from '@cliqz/adblocker-puppeteer';
import fetch from 'cross-fetch';

const {PuppeteerBlocker} = pkg;

const channels = [
    'channel/UCq22aK0t0mrOEq676Be4ezw',
    'channel/UC2fVSthyWxWSjsiEAHPzriQ',
    'c/ChilledCow',
];
const channelUrlTemplate = 'https://www.youtube.com/${channel}/videos';

const videosPerChannel = 20;
const thumbnailDownloadPath = './loife/img/thumbnail/';
const fullImgDownloadPath = './loife/img/full/';
const thumbnailImgUrlTemplate = 'https://i.ytimg.com/vi/${image}/hqdefault.jpg';
const videoUrlTemplate = 'https://www.youtube.com/watch?v=${videoId}&t=20';
let thumbnailImgUrl
let channelUrl

const download = async (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

function getVideoId(thumbnailImgUrl) {
    return thumbnailImgUrl.split('?')[0].split('/')[4];
}

async function downloadThumbnail(thumbnailImgUrl, channelId, thumbnailId) {
    await download(thumbnailImgUrl, thumbnailDownloadPath + channelId + '_' + thumbnailId + '.jpeg', () => {
        console.log(`✅ Download Done!`);
    });
}

async function downloadFullImage(page, videoId, channelId, imageId) {
    let videoUrl = videoUrlTemplate.replace('${videoId}', videoId);
    console.log(`videoUrl: ${videoUrl}`);

    await page.goto(videoUrl, {waitUntil: 'networkidle2'});

    const video = await page.$('.html5-video-player');
    await page.evaluate(() => {
        // Hide youtube player controls.
        let dom = document.querySelector('.ytp-chrome-bottom')
        dom.style.display = 'none'
    })

    // check white screen ads, couldn't find a way to click that skip ad button,
    // will wait for it for now.
    let skipAdsButton1 = await page.$x("//div[contains(text(), 'Skip Ads')]");
    let skipAdsButton2 = await page.$x("//div[contains(text(), 'Skip ad')]");
    if (skipAdsButton1.length > 0 || skipAdsButton2.length > 0) {
        // await page.screenshot({path: `${fullImgDownloadPath}${channelId}_${imageId}_ad.jpeg`});
        await page.waitForTimeout(10000);
    }

    await video.screenshot({path: `${fullImgDownloadPath}${channelId}_${imageId}.jpeg`});
}

async function run() {

    let channelId = 1;

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

    for (const channel of channels) {
        let videoIds = [];
        channelUrl = channelUrlTemplate.replace('${channel}', channel);
        console.log(`checking at channel: ${channelUrl}`);
        await page.goto(channelUrl, {waitUntil: 'networkidle2'});
        // await page.screenshot({path: 'test.jpeg'});

        let count = 0;
        const thumbnails = await page.$$('a#thumbnail');

        // download thumbnails
        for (const thumbnail of thumbnails) {
            thumbnailImgUrl = await thumbnail.$eval('img', thumbnailImg => thumbnailImg.src);

            count += 1
            await downloadThumbnail(thumbnailImgUrl, channelId, count);

            videoIds.push(getVideoId(thumbnailImgUrl));

            if (count === videosPerChannel) {
                console.log('complete one channel');
                break;
            }
        }

        // download full images
        for (const [i, videoId] of videoIds.entries()) {
            await downloadFullImage(page, videoId, channelId, i);
        }

        channelId += 1;
    }

    await browser.close();
    console.log('done!')
}

run();