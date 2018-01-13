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
        payload = {name: $( "#inputRunName ").val()};
        console.log("Starting run");
        $.ajax({
            url:raspAddr+"/api/v1/run",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
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
        var data = JSON.parse(msg);
        $( "#inputCurrentTemp" ).val(data.temp_reading_degc);
        $( "#inputTempMinutes" ).val(data.degc_minutes);
        if (data.enabled){
            $( "#inputRunName" ).val(data.name);
        }
        setEnabledState(data.enabled);
    });
    socket.on('event', function(msg) {
        console.log(msg);
        var data = JSON.parse(msg);
        if (data.type == 'done'){
            $( "#successAlert").show();
        }
        $( "#alertArea" ).append(
            `
                <div id="successAlert" class="alert alert-success alert-dismissible fade show" style="display: none;" role="alert">
                    <strong>Done!</strong> Reached target.
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>

            `
        )
    });

    $.getJSON(raspAddr+"/api/v1/sys-info", function(result){
        $( "#versionArea ").append(result.version);
        $( "#ipaddrArea ").append(result.ipaddr);
    });
    $.getJSON(raspAddr+"/api/v1/target-temp-degc", function(result){
        $( "#inputTargetTemp ").val(result.value);
    });
    $.getJSON(raspAddr+"/api/v1/target-degc-minutes", function(result){
        $( "#inputTargetTempMinutes ").val(result.value);
    });

    
    $('#loginModal').modal('hide');
}

function setEnabledState(isRunning) {
    if (isRunning) {
        $( "#cancelButton" ).show()
        $( "#goButton" ).hide()
        $( '#inputRunName' ).prop('readonly', true);
    } else {
        $( "#cancelButton" ).hide()
        $( "#goButton" ).show()
        $( '#inputRunName' ).prop('readonly', false);
        $( "#inputRunName" ).val("");
    }
}


