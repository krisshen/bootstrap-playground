const puppeteer = require('puppeteer');

let url = 'https://www.youtube.com/channel/UCq22aK0t0mrOEq676Be4ezw/videos';

let thumbnailImgSrc

async function run() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', ]
    })
    console.log('start...')
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 })
    await page.goto(url, {waitUntil: 'networkidle2'});
    await page.screenshot({path: 'test.jpeg'});

    const thumbnails = await page.$$('a#thumbnail');
    for (const thumbnail of thumbnails) {
        thumbnailImgSrc = await thumbnail.$eval('img', thumbnailImg => thumbnailImg.src);

        console.log(thumbnailImgSrc.split('?')[0]);
    }

    await browser.close();
    console.log('done!')
}

run();