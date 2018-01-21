console.log("Loaded dashboard.js")

userId = null;
apiKey = null;

var color = Chart.helpers.color;
var config = {
    type: 'line',
    data: {
        datasets: [{
            label: "Measured Temperature",
            backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
            borderColor: window.chartColors.blue,
            fill: true,
            data: []
        }]
    },
    options: {
        legend: {
            display: false
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                type: "time",
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                },
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Temp (deg C)'
                }
            }]
        }
    }
};

window.onload = function() {
    var ctx = document.getElementById("canvas").getContext("2d");
    window.myLine = new Chart(ctx, config);
};

$( document ).ready(function() {
    $( "#cancelButton" ).hide()
    $( "#goButton" ).hide()
    $( "#thermostatEnableButton" ).hide()
    $( "#thermostatDisableButton" ).hide()

    $( "#inputTargetTemp" ).change(function() {
        payload = {
            value: $( "#inputTargetTemp ").val(),
            user_id: userId,
            api_key: apiKey,
        }
        $.ajax({
            url:raspAddr+"/api/v1/target-temp-degc",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });

    $( "#inputPeriod" ).change(function() {
        payload = {
            value: $( "#inputPeriod ").val(),
            user_id: userId,
            api_key: apiKey,
        }
        $.ajax({
            url:raspAddr+"/api/v1/period_s",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });

    $( "#inputTargetTempMinutes" ).change(function() {
        payload = {
            value: $( "#inputTargetTempMinutes").val(),
            user_id: userId,
            api_key: apiKey,
        }
        $.ajax({
            url:raspAddr+"/api/v1/target-degc-minutes",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });

    $( "#thermostatEnableButton").click(function() {
        payload = {
            value: true,
            user_id: userId,
            api_key: apiKey,
        }
        $.ajax({
            url:raspAddr+"/api/v1/thermostat-enabled",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });
    
    $( "#thermostatDisableButton").click(function() {
        payload = {
            value: false,
            user_id: userId,
            api_key: apiKey,
        }
        $.ajax({
            url:raspAddr+"/api/v1/thermostat-enabled",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });

    $( "#goButton").click(function() {
        payload = {
            name: $( "#inputRunName").val(),
            enabled: true,
            user_id: userId,
            api_key: apiKey,
        }
        console.log("Starting run");
        $.ajax({
            url:raspAddr+"/api/v1/run",
            type:"POST",
            data:JSON.stringify(payload),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
        });
    });
    
    $( "#cancelButton").click(function() {
        console.log("Cancelling run");
        payload = {
            name: $( "#inputRunName").val(),
            enabled: false,
            user_id: userId,
            api_key: apiKey,
        }
        $.ajax({
            url:raspAddr+"/api/v1/run",
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

    getApiKey();

    socket = io.connect(raspAddr);
    socket.on('connect', function () {
        console.log("Websocket connected");
        $( "#connStatusCircle" ).css("background-color", "green");
        socket.emit('status', {data: 'Web client connected'});
        $.getJSON(raspAddr+"/api/v1/sys-info", function(result){
            $( "#versionArea ").html(result.version);
            $( "#ipaddrArea ").html(result.ipaddr);
        });
        $.getJSON(raspAddr+"/api/v1/target-temp-degc", function(result){
            $( "#inputTargetTemp ").val(result.value);
        });
        $.getJSON(raspAddr+"/api/v1/target-degc-minutes", function(result){
            $( "#inputTargetTempMinutes ").val(result.value);
        });
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
        if (data.pump_on) {
            $( "#inputPumpStatus" ).val('Running');
        } else {
            $( "#inputPumpStatus" ).val('Off');
        }
        // $( "#inputTargetTemp" ).val(data.target_temp_degc);
        // $( "#inputTargetTempMinutes" ).val(data.target_degc_minutes);
        // $( "#inputPeriod" ).val(data.period_s);
        if (data.run_enabled){
            $( "#inputRunName" ).val(data.name);
        }
        setRunEnabledState(data.run_enabled);
        setThermostatEnabledState(data.thermostat_enabled);
        var newTime = moment(data.timestamp);
        for (var index = 0; index < config.data.datasets.length; ++index) {
            config.data.datasets[index].data.push({
                x: newTime,
                y: data.temp_reading_degc,
            });
        }

        window.myLine.update();
    });
    socket.on('event', function(msg) {
        console.log(msg);
        var data = JSON.parse(msg);
        if (data.type == 'done'){
            $( "#successAlert").show();
        }
        $( "#alertArea" ).append(
            `
                <div id="successAlert" class="alert alert-success alert-dismissible fade show" role="alert">
                    <strong>Done!</strong> Reached target.
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>

            `
        )
    });

    $('#loginModal').modal('hide');
}

function setThermostatEnabledState(isRunning) {
    if (isRunning) {
        $( "#thermostatDisableButton" ).show()
        $( "#thermostatEnableButton" ).hide()
    } else {
        $( "#thermostatDisableButton" ).hide()
        $( "#thermostatEnableButton" ).show()
    }
}

function setRunEnabledState(isRunning) {
    if (isRunning) {
        $( "#cancelButton" ).show()
        $( "#goButton" ).hide()
        $( '#inputRunName' ).prop('readonly', true);
    } else {
        $( "#cancelButton" ).hide()
        $( "#goButton" ).show()
        $( '#inputRunName' ).prop('readonly', false);
    }
}

function getApiKey() {
    payload = {
        username: $( "#inputUsername" ).val(),
        password: $( "#inputPassword" ).val(),
    };
    $.ajax({
        url:raspAddr+"/get-api-key",
        type:"POST",
        data:JSON.stringify(payload),
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: function(data) {
            userId = data.user_id;
            apiKey = data.api_key;
            console.log("User id: " + userId + ", API Key: " + apiKey)
            $( "#loginFailAlert").alert('close');
        },
        error: function(data) {
            $( "#alertArea" ).append(
                `
                    <div id="loginFailAlert" class="alert alert-warning alert-dismissible fade show" role="alert">
                        <strong>Invalid credentials</strong> Entering read-only mode. Hit the "Auth" button to try logging in again.
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                `
            );
        }
    });
}


