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

    let randomNumbers = generateRandomNumbers(8);
    // let randomNumbers = [1, 11, 15, 20, 21, 40, 41, 60];
    console.log(randomNumbers);

    let imageIds = getImageIds(randomNumbers);
    console.log(imageIds);

    let modal = $('.modal');

    modal.on('hide.bs.modal', function () {
        // let memory = $(this).html();
        // $(this).html(memory);
        $("#videoIframe").attr('src', '');
    })

    modal.on('show.bs.modal', function (e) {
        $("#videoIframe").attr('src', videos[`${e.relatedTarget.id}`]);
    })
});