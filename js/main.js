var rbServer = null;

// These lines create a topic object as defined by roslibjs
var cmdVelTopic = null;

var poseTopic = null;

// These lines create a message that conforms to the structure of the Twist defined in our ROS installation
// It initalizes all properties to zero. They will be set to appropriate values before we publish this message.
var twist = new ROSLIB.Message({
    linear : {
        x : 0.0,
        y : 0.0,
        z : 0.0
    },
    angular : {
        x : 0.0,
        y : 0.0,
        z : 0.0
    }
});

function createWebSocket(){

    var ip = document.getElementById('wsip').value;
    var port = document.getElementById('portnum').value;

    rbServer = new ROSLIB.Ros({
        url : 'ws://' + ip + ':' +port
    });

// This function is called upon the rosbridge connection event
    rbServer.on('connection', function() {
        // Write appropriate message to #feedback div when successfully connected to rosbridge
        var fbDiv = document.getElementById('feedback');
        fbDiv.innerHTML = "<p>Connected to websocket server.</p>";

        var connectBtn = document.getElementById('connect');
        connectBtn.className = 'btn btn-success';

        //enable the movement control buttons
        setMovementButtonDisabled(false);
        //disable the connect button
        $('#connect').prop('disabled', true);
        //enable the disconnect button
        $('#disconnect').prop('disabled', false);

        registerPoseTopic();
        initPinValue();

        $('#status').bootstrapToggle('enable')
    });

    // This function is called when there is an error attempting to connect to rosbridge
    rbServer.on('error', function(error) {
        // Write appropriate message to #feedback div upon error when attempting to connect to rosbridge
        var fbDiv = document.getElementById('feedback');
        fbDiv.innerHTML = "<p>Error connecting to websocket server.</p>";
        var connectBtn = document.getElementById('connect');
        connectBtn.className = 'btn btn-warning';
    });

    // This function is called when the connection to rosbridge is closed
    rbServer.on('close', function() {
        // Write appropriate message to #feedback div upon closing connection to rosbridge
        var fbDiv = document.getElementById('feedback');
        fbDiv.innerHTML = "<p>Connection to websocket server closed.</p>";
        var connectBtn = document.getElementById('connect');
        connectBtn.className = 'btn btn-warning';

        //enable the disconnect button
        $('#disconnect').prop('disabled', true);
        //disable the movement control buttons
        setMovementButtonDisabled(true);
        //enable the connect button
        $('#connect').prop('disabled', false);
        //disable the disconnect button
        $('#disconnect').prop('disabled', true);

        $('#status').bootstrapToggle('disable');
    });

// These lines create a topic object as defined by roslibjs
    cmdVelTopic = new ROSLIB.Topic({
        ros : rbServer,
        name : '/turtle1/cmd_vel',
        messageType : 'geometry_msgs/Twist'
    });

}

function setMovementButtonDisabled(flag){

    $('#left').prop('disabled',flag);
    $('#right').prop('disabled',flag);
    $('#forward').prop('disabled',flag);
    $('#back').prop('disabled',flag);

}

function disconnect(){
    if(poseTopic){
        poseTopic.unsubscribe(function(){
            console.log('poseTopic is unsubscribed...')
        });
    }
    rbServer.close();
}

function movementHandler(direction)
{
    /**
     Set the appropriate values on the twist message object according to values in text boxes
     It seems that turtlesim only uses the x property of the linear object
     and the z property of the angular object
     **/

    // get values from text input fields. Note for simplicity we are not validating.
    var linearX = 0.0;
    var angularZ = 0.0;

    if (direction == 'left')
    {
        angularZ = 0.5;
    }
    else if (direction == 'right')
    {
        angularZ = -0.5;
    }
    else if (direction == 'forward')
    {
        linearX = 0.1;
    }
    else if (direction == 'back')
    {
        linearX = -0.1;
    }

    // Set the appropriate values on the message object
    twist.linear.x = linearX;
    twist.angular.z = angularZ;

    // Publish the message
    cmdVelTopic.publish(twist);
}

function registerPoseTopic(){
// These lines create a topic object as defined by roslibjs
    poseTopic = new ROSLIB.Topic({
        ros : rbServer,
        name : '/turtle1/pose',
        messageType : 'turtlesim/Pose'
    });

    poseTopic.subscribe(function(data){
        $('table tr').eq(1).find('td').eq(1).html(data.x);
        $('table tr').eq(2).find('td').eq(1).html(data.y);
        $('table tr').eq(3).find('td').eq(1).html(data.linear_velocity);
        $('table tr').eq(4).find('td').eq(1).html(data.angular_velocity);
        $('table tr').eq(5).find('td').eq(1).html(data.theta);
    })
}

function writeDigit2Pin(pin, value){

    var digitWriteClient = new ROSLIB.Service({
        ros : rbServer,
        name : '/arduino/digital_write',
        serviceType : 'ros_arduino_msgs/DigitalWrite'
    });

    var request2 = new ROSLIB.ServiceRequest({
        pin : pin,
        value: value
    });

    digitWriteClient.callService(request2, function(result) {
        console.log('Result for service call on '
            + digitWriteClient.name + ':');
        console.dir(result);
    });
}

function queryStatusOfPin(pin){
    var digitReadClient = new ROSLIB.Service({
        ros : rbServer,
        name : '/arduino/digital_read',
        serviceType : 'ros_arduino_msgs/DigitalRead'
    });

    var request = new ROSLIB.ServiceRequest({
        pin : pin
    });

    digitReadClient.callService(request, function(result) {
        console.log('Result for service call on '
            + digitReadClient.name + ':');
        var pinValue = result.value;
        // if(pinValue){
        //     $('#status').bootstrapToggle('on')
        // }else{
        //     $('#status').bootstrapToggle('off')
        // }
        $('#pinStatusText').html("The latest status of the pin value is: " + pinValue);
    });
}

function initUIComponents(){

    $('button.direction').click(function(e){
        var jqBtnObj = $(this);
        var direction = jqBtnObj.attr('name');
        movementHandler(direction);
    });

    $(".nav-tabs a").click(function(){

        $(this).tab('show');
        var id = $(this).attr('href').substr(1);

    });

    $("#connect").click(function(e){
        createWebSocket();
    });

    $('#disconnect').click(function(){
        disconnect();
    });

    $('#status').bootstrapToggle();
    $('#status').bootstrapToggle('disable');

    $('#status').change(function(event) {
        var value = $(this).prop('checked');// true | false
        console.log(value);

        var pin = $('#pinnum').val();
        writeDigit2Pin(parseInt(pin), value);
        queryStatusOfPin(parseInt(pin));
    });
}

function initPinValue(){
    var pin = $('#pinnum').val();
    queryStatusOfPin(parseInt(pin));
}

function loadRosTopicItems(){
    rbServer.getTopics(function(data){
        //the data is an array object
        var optionStringArray = [];
        data.forEach(function(topicName){
            $('.selectpicker').append($('<option>', {
                value: topicName,
                text : topicName
            }));
        });
        $('.selectpicker').selectpicker('refresh');
        $('.selectpicker').selectpicker('render');
        $('.selectpicker').on('change', onRosTopicItemClick);
    }, function(error){
        console.error(error);
    });
}

function onRosTopicItemClick(e){
    var selected = $(this).find("option:selected").val();
    //load topic by type
    rbServer.getTopicsForType(selected, function(data){
        console.log(data);
    }, function(error){
        console.error(error);
    })
}


$(document).ready(function(){

    initUIComponents();
});
