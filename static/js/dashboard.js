console.log("Loaded dashboard.js")

$( document ).ready(function() {
    $('#loginModal').modal({
        backdrop: 'static',
        keyboard: false
      });
    $('#loginModal').modal('show');
});

function postSetup() {
    raspAddr = $("#inputRaspAddr").val();
    socket = io.connect(raspAddr);
    socket.on('connect', function () {
        console.log("Websocket connected");
        socket.emit('status', {data: 'Connected'});
    });
    socket.on('log', function(msg) {
        console.log(msg);
        console.log(JSON.parse(msg).tempc_reading)
    });
    $('#loginModal').modal('hide');
}

