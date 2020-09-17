const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');

const channels = [
    'channel/UCq22aK0t0mrOEq676Be4ezw',
    'channel/UC2fVSthyWxWSjsiEAHPzriQ',
    'c/ChilledCow',
];
const thumbnailsPerChannel = 20;
const downloadPath = './loife/img/';
let channelUrlTemplate = 'https://www.youtube.com/${channel}/videos';
let thumbnailImgUrlTemplate = 'https://i.ytimg.com/vi/${image}/hqdefault.jpg';
let thumbnailImgUrl
let channelUrl
let imageId

const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

async function run() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', ]
    })
    console.log('start...')
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 })

    for (const channel of channels) {
        channelUrl = channelUrlTemplate.replace('${channel}', channel);
        console.log(`checking at channel: ${channelUrl}`);
        await page.goto(channelUrl, {waitUntil: 'networkidle2'});
        // await page.screenshot({path: 'test.jpeg'});

        let count = 0;
        const thumbnails = await page.$$('a#thumbnail');
        for (const thumbnail of thumbnails) {
            thumbnailImgUrl = await thumbnail.$eval('img', thumbnailImg => thumbnailImg.src);

            console.log(thumbnailImgUrl.split('?')[0]);
            download(thumbnailImgUrl, downloadPath + channel.replace('/', '') + '_' + count + '.jpeg', () => {
                console.log('✅ Done!')
            });

            count+=1
            if (count === thumbnailsPerChannel) {
                console.log('complete one channel');
                break;
            }
        }
    }



    await browser.close();
    console.log('done!')
}

run();