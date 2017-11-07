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


window.addEventListener('keyup', keyDownHandler);

function createWebSocket(){
    //if there exists one socket connection open
    if(rbServer!== null){
        rbServer.close();
    }

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
    });

// These lines create a topic object as defined by roslibjs
    cmdVelTopic = new ROSLIB.Topic({
        ros : rbServer,
        name : '/turtle1/cmd_vel',
        messageType : 'geometry_msgs/Twist'
    });

}

function disconnect(){
    if(rbServer){
        rbServer.close()
        var connectBtn = document.getElementById('connect');
        connectBtn.className = 'btn btn-warning';
    }
}

function keyDownHandler(event)
{
    var keyPressed = event.keyCode;
    var LEFT = 37;
    var UP = 38;
    var RIGHT = 39;
    var DOWN = 40;

    /**
     Set the appropriate values on the twist message object according to values in text boxes
     It seems that turtlesim only uses the x property of the linear object
     and the z property of the angular object
     **/
    var linearX = 0.0;
    var linearY = 0.0;
    var linearZ = 0.0;
    var angularX = 0.0;
    var angularY = 0.0;
    var angularZ = 0.0;


    // get values from text input fields. Note for simplicity we are not validating.
    linearX = 0 ;
    linearY = 0 ;
    linearZ = 0 ;

    angularX = 0 ;
    angularY = 0 ;
    angularZ = 0 ;


    if (keyPressed == LEFT)
    {
        angularZ = 0.5;
    }
    else if (keyPressed == RIGHT)
    {
        angularZ = -0.5;
    }
    else if (keyPressed == UP)
    {
        linearX = 0.1;
    }
    else if (keyPressed == DOWN)
    {
        linearX = -0.1;
    }

    // Set the appropriate values on the message object
    twist.linear.x = linearX;
    twist.linear.y = linearY;
    twist.linear.z = linearZ;

    twist.angular.x = angularX;
    twist.angular.y = angularY;
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
        console.log(data);
    })
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
    $("#connect").click(function(e){
        createWebSocket();
        // loadRosTopicItems();
        registerPoseTopic();
    });

    $('#disconnect').click(function(){
        disconnect();
    });

    $(".nav-tabs a").click(function(){
        console.dir(this);
        $(this).tab('show');
        var id = $(this).attr('href').substr(1);
        console.log(id);
    });
});
