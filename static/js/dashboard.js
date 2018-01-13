console.log("Loaded dashboard.js")

socket = io.connect("http://localhost:5000");

socket.on('connect', function () {
    console.log("Websocket connected")
    socket.emit('status', {data: 'Connected'});
});

socket.on('log', function(msg) {
    console.log(msg);
    console.log(JSON.parse(msg).tempc_reading)
});