console.log("Loaded dashboard.js")

$( document ).ready(function() {
    $( "#cancelButton" ).hide()
    $( "#goButton" ).hide()

    $( "#inputTargetTemp" ).change(function() {
        payload = {value: $( "#inputTargetTemp ").val()};
        $.ajax({
            url:raspAddr+"/api/v1/target-temp-degc",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });

    $( "#inputTargetTempMinutes" ).change(function() {
        payload = {value: $( "#inputTargetTempMinutes ").val()};
        $.ajax({
            url:raspAddr+"/api/v1/target-degc-minutes",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });

    $( "#goButton").click(function() {
        console.log("Starting run");
        payload = {value: true};
        $.ajax({
            url:raspAddr+"/api/v1/enabled",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });
    
    $( "#cancelButton").click(function() {
        console.log("Cancelling run");
        payload = {value: false};
        $.ajax({
            url:raspAddr+"/api/v1/enabled",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });

    });

    $( '#loginModal' ).modal({
        backdrop: 'static',
        keyboard: false
      });
    $( '#loginModal' ).modal('show');
});

function postSetup() {
    raspAddr = $( "#inputRaspAddr" ).val();
    socket = io.connect(raspAddr);
    socket.on('connect', function () {
        console.log("Websocket connected");
        $( "#connStatusCircle" ).css("background-color", "green");
        socket.emit('status', {data: 'Web client connected'});
    });
    socket.on('disconnect', function () {
        console.log("Websocket disconnected");
        $( "#connStatusCircle" ).css("background-color", "red");
        socket.emit('status', {data: 'Web client disconnected'});
    });
    socket.on('log', function(msg) {
        console.log(msg);
        data = JSON.parse(msg);
        $( "#inputCurrentTemp" ).val(data.temp_reading_degc);
        setEnabledState(data.enabled);
    });
    $('#loginModal').modal('hide');
}

function setEnabledState(isRunning) {
    if (isRunning) {
        $( "#cancelButton" ).show()
        $( "#goButton" ).hide()
    } else {
        $( "#cancelButton" ).hide()
        $( "#goButton" ).show()
    }
}


