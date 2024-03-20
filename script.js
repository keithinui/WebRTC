'use strict';

let localStream = null;
let peer = null;
let existingCall = null;
let timer;

navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then(function (stream) {
        // Success
        $('#my-video').get(0).srcObject = stream;
        localStream = stream;
        setupDefaultUI();        // Set to default UI
    }).catch(function (error) {
    // Error
    console.error('mediaDevice.getUserMedia() error:', error);
    return;
});

peer = new Peer({
    key: 'fb5dbf65-0a0d-44cb-851f-076a7550e4ec',
    debug: 3
});

peer.on('open', function(){
    $('#my-id').text(peer.id);
});

peer.on('error', function(err){
    alert(err.message);
    setupDefaultUI();        // Set to default UI
});

peer.on('close', function(){
});

peer.on('disconnected', function(){
});

$('#make-call').submit(function(e){
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream);
    setupCallEventHandlers(call);
});

$('#end-call').click(function(){
    existingCall.close();
    clearInterval(timer);
    setupDefaultUI();        // Set to default UI
});

// Getting Stats 
$('#getting-stats').on('click', () => {
    let bytesReceivedPrevious = 0;     // Previous sample data of bytesReceived 
    let bytesSentPrevious = 0;         // Previous sample data of bytesSent 
//    timer = setInterval(async () => {
            console.log("Timer!!!!"); 
//    },1000);
    $('#getting-stats').hide();
    $('#stop-acquiring-stats').show();
});

// Stop acquiring stats
$('#stop-acquiring-stats').on('click', () => {
    clearInterval(timer);
        $('#getting-stats').show();
        $('#stop-acquiring-stats').hide();
});

peer.on('call', function(call){
    call.answer(localStream);
    setupCallEventHandlers(call);
});

function setupDefaultUI(){
    $('#callto-id').focus();
    $('#getting-stats').show();
    $('#stop-acquiring-stats').hide();
    $('#inbound-codec').text('');
    $('#outbound-codec').text('');
    $('#inbound-video').text('');
    $('#outbound-video').text('');
}

function setupCallEventHandlers(call){
    if (existingCall) {
        existingCall.close();
    };

    existingCall = call;

    call.on('stream', function(stream){
        addVideo(call,stream);
        setupEndCallUI();
        $('#their-id').text(call.remoteId);
    });
    call.on('close', function(){
        removeVideo(call.remoteId);
        setupMakeCallUI();
    });
}

function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

function removeVideo(peerId){
    $('#'+peerId).remove();
}

function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}

function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
}
