$(document).ready(function (){

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