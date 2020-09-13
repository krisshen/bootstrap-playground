$(document).ready(function (){

    let videos = {
        loife1: "https://www.youtube.com/embed/tQvNJDUhzBQ",
        loife2: "https://www.youtube.com/embed/eflmhB-TZnY",
        loife3: "https://www.youtube.com/embed/2WtiKh7HMak",
        loife4: "https://www.youtube.com/embed/liHgt4CbodY",
        loife5: "https://www.youtube.com/embed/MpuiLbK-13c",
        loife6: "https://www.youtube.com/embed/2iCQkkfkE7I",
        loife7: "https://www.youtube.com/embed/LxfipRfsvh8",
        loife8: "https://www.youtube.com/embed/jYdjxKmsK9I",
    };

    $('.modal').on('hide.bs.modal', function() {
        // let memory = $(this).html();
        // $(this).html(memory);
        $("#videoIframe").attr('src', '');
    })

    $('.modal').on('show.bs.modal', function (e) {
        $("#videoIframe").attr('src', videos[`${e.relatedTarget.id}`]);
    })
});