/**
 * Script to process incoming phone calls
 * If call received during working hours standard greeing will be played
 * otherwise greeting for non-working hours will be played
 * Caller can enter extension number or can wait till greeting playback ends and
 * then will be forwarded all operators (extensions used as operators can be specified in operators array)
 * and will be connected with the first operator who answered
 * Rule should be specified for VoxImplant application to run the script
 */
// String used to store DTMF input
var input = '',
    // used to store Caller ID
    callerid,
    // user to store Display Name of the caller
    displayName,
    operatorTimer,
    // Timeout to let the caller enter extension number
    TIMEOUT = 3000,
    // PBX extensions used marked as operators, usernames should look like 101@appname.accountname.voximplant.com
    operators = ['101', '102', '103'],
    operatorCalls = {},
    nOperatorCalls = 0,
    GMT_offset = 4, // time difference with GMT
    /**
     * Working hours, calls are forwarded to extensions only during working hours,
     * for non-working hours pre-recorded message will be played
     */
    workingHours = [
        [0, 0], // Sun
        [10, 19], // Mon
        [10, 19], // Tue
        [10, 19], // Wed
        [10, 19], // Thu
        [10, 19], // Fri
        [0, 0] // Sat
    ],
    // flag for non-working hours
    nonWorkingHours = false,
    // used to store active call object
    activeOperatorCall,
    // URL to mp3 file with standard greeting 
    workingHoursGreetingURL = 'http://yourdomain.com/ivr.mp3',
    // URL to mp3 file with custom greeting for non-working hours
    nonWorkingHoursGreetingURL = 'http://yourdomain.com/ivr_nwh.mp3',
    /**
     * used to specify Caller ID for outbound calls,
     * number can be authorized in VoxImplant Control Panel -> Settings -> CallerIDs
     */
    officeNumber = 'your_authorized_caller_id';

/**
 * Forward incoming call to operators
 */
function forwardCallToOperator(call) {
    // disable tones processing
    call.handleTones(false);
    nOperatorCalls = 0;
    // play progress tone, see http://voximplant.com/docs/references/appengine/Call.html#playProgressTone for details
    call.playProgressTone("RU");
    // call all operators simultaneously
    for (var i in operators) {
        var j = operators[i];
        nOperatorCalls++;
        // see http://voximplant.com/docs/references/appengine/VoxEngine.html#callUser for details
        operatorCalls[j] = VoxEngine.callUser(j, callerid, displayName);
        operatorCalls[j].addEventListener(CallEvents.Failed, function(e) {
            if (typeof activeOperatorCall == "undefined") {
                delete operatorCalls[e.call.number()];
                nOperatorCalls--;
                if (nOperatorCalls == 0) {
                    // see http://voximplant.com/docs/references/appengine/Call.html#hangup for details
                    call.hangup();
                }
            }
        });

        operatorCalls[j].addEventListener(CallEvents.Connected, function(e) {
            delete operatorCalls[e.call.number()];
            activeOperatorCall = e.call;
            // see http://voximplant.com/docs/references/appengine/VoxEngine.html#sendMediaBetween for details
            VoxEngine.sendMediaBetween(call, e.call);
            activeOperatorCall.addEventListener(CallEvents.Disconnected, VoxEngine.terminate);
            for (var i in operatorCalls) {
                operatorCalls[i].hangup();
            }
            operatorCalls = {};
        });
    }
}

/**
 * Forward incoming call to particular extension
 */
function forwardCallToExtension(call, ext) {
    clearTimeout(operatorTimer);
    call.handleTones(false);
    call.playProgressTone("RU");
    // create new call to user to forward call to extension
    var call2 = VoxEngine.callUser(ext, callerid, displayName);
    // Add event handlers, see http://voximplant.com/docs/references/appengine/CallEvents.html for details
    call2.addEventListener(CallEvents.Failed, VoxEngine.terminate);
    call2.addEventListener(CallEvents.Connected, function(e) {
        // join incoming call and call to user/ext
        VoxEngine.sendMediaBetween(call, call2);
    });
    call2.addEventListener(CallEvents.Disconnected, VoxEngine.terminate);
}

VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
    // store Caller ID of the call
    callerid = e.callerid;
    // store Display Name of the call
    displayName = e.displayName;
    e.call.addEventListener(CallEvents.Connected, function(e) {
        // Check if call was made during working hours
        var d = new Date(new Date().getTime() + GMT_offset * 3600 * 1000),
            day = d.getUTCDay(),
            hour = d.getUTCHours();
        Logger.write("Day: " + day + " Hour: " + hour);
        if (hour >= workingHours[day][0] && hour < workingHours[day][1]) {
            /**
             * Working-hours
             * standard greeting playback, see http://voximplant.com/docs/references/appengine/Call.html#startPlayback for details
             */
            e.call.startPlayback(workingHoursGreetingURL, false);
            e.call.record();
        } else {
            /** 
             * Non-working hours
             * non-working hours greeting playback
             */
            nonWorkingHours = true;
            e.call.startPlayback(nonWorkingHoursGreetingURL, false);
        }
    });

    e.call.addEventListener(CallEvents.Disconnected, function(e) {
        // Terminate session, see http://voximplant.com/docs/references/appengine/VoxEngine.html#terminate for details
        VoxEngine.terminate();
    });

    e.call.addEventListener(CallEvents.PlaybackFinished, function(e) {
        // If call while working hours give some time to enter the extension before calling operators
        if (!nonWorkingHours) {
            operatorTimer = setTimeout(function() {
                forwardCallToOperator(e.call);
            }, TIMEOUT);
        } else VoxEngine.terminate(); // otherwise - terminate session 
    });

    /**
     * Handle tones to check entered extension
     */
    e.call.addEventListener(CallEvents.ToneReceived, function(e) {
        // stop playback of the greeting
        e.call.stopPlayback();
        // add digit until 3 digits entered
        input += e.tone;
        if (input.length == 3) {
            // forward the call to extension
            forwardCallToExtension(e.call, input);
        }
    });

    // Enable tones processing
    e.call.handleTones(true);
    // Answer incoming call
    e.call.answer();
});
