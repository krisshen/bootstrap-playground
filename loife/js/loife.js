function generateRandomNumbers(size) {
    let numbers = [];
    while (numbers.length < size) {
        let n = Math.floor(Math.random() * 60) + 1;
        if (numbers.indexOf(n) === -1) numbers.push(n);
    }
    return numbers;
}

$(document).ready(function (){

    let randomNumbers = generateRandomNumbers(8);

    console.log(randomNumbers);

    let modal = $('.modal');

    modal.on('hide.bs.modal', function() {
        // let memory = $(this).html();
        // $(this).html(memory);
        $("#videoIframe").attr('src', '');
    })

    modal.on('show.bs.modal', function (e) {
        $("#videoIframe").attr('src', videos[`${e.relatedTarget.id}`]);
    })
});