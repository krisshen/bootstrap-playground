function generateRandomNumbers(size) {
    let numbers = [];
    while (numbers.length < size) {
        let n = Math.floor(Math.random() * 60) + 1;
        if (numbers.indexOf(n) === -1) numbers.push(n);
    }
    return numbers;
}

function getImageIds(numbers) {
    const videoSize = 20;
    let channelId
    let videoId
    let imageIds = [];
    let d, m;

    for (const number of numbers) {
        d = number / videoSize;
        channelId = d <= 1 ? 1 : d <= 2 ? 2 : 3;
        m = number % videoSize
        videoId = m === 0 ? 20 : m;
        imageIds.push(channelId + '_' + videoId);
    }

    return imageIds;
}

$(document).ready(function () {

    // generate random numbers for channels and videos
    let randomNumbers = generateRandomNumbers(8);
    // let randomNumbers = [1, 11, 15, 20, 21, 40, 41, 60]; // for test
    // console.log(randomNumbers);

    let imageIds = getImageIds(randomNumbers);
    // console.log(imageIds);

    // get each loife element and set id, thumbnail and hover images
    let loifeElements = $(".loife")
    loifeElements.each(function (i) {
        const imageId = imageIds[i];
        if (!window.loifeUtils.validateImageId(imageId)) {
            console.error('Invalid image ID:', imageId);
            return;
        }
        this.id = imageId;
        this.querySelector('img').src = `img/thumbnail/${imageId}.jpeg`;

        // preload images with error handling
        let url = `img/full/${imageId}.jpeg`;
        let img = new Image();
        img.onerror = () => console.error(`Failed to load image: ${url}`);
        img.src = url;

        $(this).hover(() => {
            $(".landing-inner").css('background-image', `url(${url})`);
        });
    });

    let modal = $('.modal');

    modal.on('hide.bs.modal', function () {
        $("#videoIframe").attr('src', '');
    })

    modal.on('show.bs.modal', function (e) {
        const videoId = e.relatedTarget.id;
        const videoUrl = videos[videoId];
        const sanitizedUrl = window.loifeUtils.sanitizeVideoUrl(videoUrl);
        
        if (!sanitizedUrl) {
            console.error('Invalid video URL for ID:', videoId);
            return;
        }
        
        $("#videoIframe").attr('src', sanitizedUrl);
    })
});