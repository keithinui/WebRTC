
/* eslint-disable require-jsdoc */
$(function() {
    // Peer object
    const peer = new Peer({
        key:   window.__SKYWAY_KEY__,
        debug: 3
    });

    let localStream;
    let existingCall;
    let timer;

    peer.on('open', () => {
        $('#my-id').text(peer.id);
        step1();
    });

    // Receiving a call
    peer.on('call', call => {
        // Answer the call automatically (instead of prompting user) for demo purposes
        call.answer(localStream, {
            // 発信側のコーデックを優先
            //videoCodec: $('#videoCodec').val()
        });
        step3(call);
    });

    peer.on('error', err => {
        alert(err.message);
        // Return to step 2 if error occurs
        step2();
    });

    $('#make-call').on('submit', e => {
        e.preventDefault();
        // Initiate a call!
        console.log($('#callto-id').val());
        const call = peer.call($('#callto-id').val(), localStream, {
            videoCodec: $('#videoCodec').val()
        });
        step3(call);
    });

    $('#end-call').on('click', () => {
        existingCall.close();
        clearInterval(timer);
        step2();
    });

    // Retry if getUserMedia fails
    $('#step1-retry').on('click', () => {
        $('#step1-error').hide();
        step1();
    });

    // Getting Stats 
    $('#getting-stats').on('click', () => {
        let bytesReceivedPrevious = 0;     // Previous sample data of bytesReceived 
        let bytesSentPrevious = 0;         // Previous sample data of bytesSent 
        timer = setInterval(async () => {
            const stats = await existingCall.getPeerConnection().getStats();
            // stats is [{},{},{},...]
            stats.forEach((report) => {
                // When RTCStatsType of report is `inbount-rtp` Object and kind is 'video'.
                if(report.type == "inbound-rtp" && report.kind == "video") {
                    // When Fields is 'bytesReceived'
                    console.log(report.bytesReceived);   // Total recived data volume of the stream
                    let buf = (report.bytesReceived - bytesReceivedPrevious)*8/1024/1024;
                    $('#inbound-video').html('bytesReceived[Mbps]: ' + buf.toFixed(2) );
                    bytesReceivedPrevious = report.bytesReceived;
                }

                // When RTCStatsType of report is `outbount-rtp` Object and kind is 'video'.
                if(report.type == "outbound-rtp" && report.kind == "video") {
                    // When Fields is 'bytesSent'
                    console.log(report.bytesSent);   // Total sent data volume of the stream
                    let buf = (report.bytesSent - bytesSentPrevious)*8/1024/1024;
                    $('#outbound-video').html('bytesSent[Mbps]: ' + buf.toFixed(2) );
                    bytesSentPrevious = report.bytesSent;
                }
            });
        },1000);
        step4();
    });

    // Stop acquiring stats
    $('#stop-acquiring-stats').on('click', () => {
        clearInterval(timer);
        step5();
    });

    // set up audio and video input selectors
    const audioSelect = $('#audioSource');
    const videoSelect = $('#videoSource');
    const selectors = [audioSelect, videoSelect];

    navigator.mediaDevices.enumerateDevices()
        .then(deviceInfos => {
        const values = selectors.map(select => select.val() || '');
    selectors.forEach(select => {
        const children = select.children(':first');
    while (children.length) {
        select.remove(children);
    }
});

    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
            option.text(deviceInfo.label ||
                'Microphone ' + (audioSelect.children().length + 1));
            audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text(deviceInfo.label ||
                'Camera ' + (videoSelect.children().length + 1));
            videoSelect.append(option);
        }
    }

    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
        return n.value === values[selectorIndex];
})) {
        select.val(values[selectorIndex]);
    }
});

    videoSelect.on('change', step1);
    audioSelect.on('change', step1);
});

    function step1() {
        // Get audio/video stream
        const audioSource = $('#audioSource').val();
        const videoSource = $('#videoSource').val();
        const constraints = {
            audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
            video: {deviceId: videoSource ? {exact: videoSource} : undefined},
        };

        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            $('#my-video').get(0).srcObject = stream;
            localStream = stream;

            if (existingCall) {
                existingCall.replaceStream(stream);
                return;
            }

            step2();
        }).catch(err => {
            $('#step1-error').show();
            console.error(err);
        });
    }

    function step2() {
        $('#step1, #step3').hide();
        $('#step2').show();
        $('#callto-id').focus();
        $('#getting-stats').show();
        $('#stop-acquiring-stats').hide();
        $('#inbound-codec').text('');
        $('#outbound-codec').text('');
        $('#inbound-video').text('');
        $('#outbound-video').text('');
    }

    function step3(call) {
        // Hang up on an existing call if present
        if (existingCall) {
            existingCall.close();
        }
        // Wait for stream on the call, then set peer video display
        call.on('stream', stream => {
            $('#their-video').get(0).srcObject = stream;
        });

        // UI stuff
        existingCall = call;
        $('#their-id').text(call.remoteId);
        call.on('close', step2);
        $('#step1, #step2').hide();
        $('#step3').show();
    }

    function step4() {
        $('#getting-stats').hide();
        $('#stop-acquiring-stats').show();
    }

    function step5() {
        $('#getting-stats').show();
        $('#stop-acquiring-stats').hide();
    }
   
});
