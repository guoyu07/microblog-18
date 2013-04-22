(function ($, io) {
    "use strict";
    var MAX_CHAR_LENGTH = 140;

    function contentChange(event) {
        var flag = false;
        if ($.msie) {
            if ('value' === event.propertyName) {
                flag = true;
            }
        } else {
            flag = true;
        }

        if (flag) {
            var content = $('#content');
            if (content.val() && '' !== $.trim(content.val())) {
                if (content.val().length > MAX_CHAR_LENGTH) {
                    content.parent().addClass('error');
                    $('#content_info').html('已经超过<strong>' + (content.val().length - MAX_CHAR_LENGTH) + '</strong>字')
                        .removeClass('hidden').addClass('alert-error');
                } else {
                    content.parent().removeClass('error');
                    $('#content_info').html('').addClass('hidden');
                    $('#btn_publish').addClass('btn-primary').attr('disabled', null);
                }
            } else {
                $('#btn_publish').removeClass('btn-primary').attr('disabled', 'disabled');
            }
        }
    }

    function publish() {
        $.ajax({
            url: '/authed/topic/add', type: 'post', dataType: 'text', data: {content: $('#content').val()}, success: function (dataText) {
                var data = eval('(' + dataText + ')');
                if ('ok' === data.status) {
                    $('#content').val('');
                    $('#content_info').html(data.msg).removeClass('hidden').removeClass('alert-error').addClass('alert-success')
                        .fadeIn('normal', function () {
                            $(this).fadeOut(2000);
                        });
                } else {
                    $('#content_info').html(data.msg).removeClass('hidden').removeClass('alert-success').addClass('alert-error');
                }
            }, error: function (xhr, status, error) {
                $('#content_info').html('发布失败，请重试').removeClass('hidden').removeClass('alert-success').addClass('alert-error');
            }
        });
    }

    $(function () {
        var socket = io.connect();
        socket.on('connect', function () {
            $("#status").html('实时通信信道已建立');
        });

        socket.on('disconnect', function (event) {
            $("#status").html('与服务器断开连接');
        });

        socket.on('message', function (message) {
            $("#news").prepend('<div class="span9 alert alert-success">' + new Date().toLocaleTimeString() + ' ' + message + '</div>');
        });

        socket.on('user message', function (message) {
            $("#news").prepend('<div class="span9 alert alert-success">' + new Date().toLocaleTimeString() + ' ' + message + '</div>');
        });

        socket.on('all user message', function (message) {
            $("#news").prepend('<div class="span9 alert alert-success">' + new Date().toLocaleTimeString() + ' ' + message + '</div>');
        });

        socket.on('user connected', function (message) {
            $("#news").prepend('<div class="span9 alert alert-success">' + new Date().toLocaleTimeString() + ' ' + message + '</div>');
        });

        $('#content').bind('input propertychange', contentChange);
        $('#btn_publish').click(publish);

        $('.alert').alert();
    });
})(jQuery, io);