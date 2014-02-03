/**
* Script to process incoming phone calls
* If call received during working hours standard greeing will be played
* otherwise greeting for non-working hours will be played
* Caller can enter extension number or can wait till greeting playback ends and 
* then will be forwarded all operators (extensions used as operators can be specified in operators array)
* and will be connected with the first operator who answered
* Rule should be specified for VoxImplant application to run the script
*/
var input = "", // String used to store DTMF input
    callerid,  // used to store Caller ID
    displayName, // user to store Display Name of the caller
    operatorTimer, //
    TIMEOUT = 3000, // Timeout to let the caller enter extension number
    operators = ["101", "102", "103"], // PBX extensions used marked as operators, usernames should look like 101@appname.accountname.voximplant.com
    operatorCalls = {},
    nOperatorCalls = 0,
    GMT_offset = 4, // time difference with GMT
    workingHours = [ // Working hours, calls are forwarded to extensions only during working hours, for non-working hours pre-recorded message will be played 
      [0,0], // Sun
      [10,19], // Mon
      [10,19], // Tue
      [10,19], // Wed
      [10,19], // Thu
      [10,19], // Fri
      [0,0] // Sat
    ],
    nonWorkingHours = false, // flag for non-working hours
    activeOperatorCall, // used to store active call object
    workingHoursGreetingURL = "http://yourdomain.com/ivr.mp3", // URL to mp3 file with standard greeting 
    nonWorkingHoursGreetingURL = "http://yourdomain.com/ivr_nwh.mp3", // URL to mp3 file with custom greeting for non-working hours
    officeNumber = "your_authorized_caller_id"; // used to specify Caller ID for outbound calls, number can be authorized in VoxImplant Control Panel -> Settings -> CallerIDs

/**
* Forward incoming call to operators
*/
function forwardCallToOperator(call) {
	call.handleTones(false); // disable tones processing
	nOperatorCalls = 0;
  call.playProgressTone("RU"); // play progress tone, see http://voximplant.com/docs/references/appengine/Call.html#playProgressTone for details
 	for (var i in operators) { // call all operators simultaneously
    var j = operators[i];
	  nOperatorCalls++;
	  operatorCalls[j] = 	VoxEngine.callUser(j, callerid, displayName); // see http://voximplant.com/docs/references/appengine/VoxEngine.html#callUser for details
    operatorCalls[j].addEventListener(CallEvents.Failed, function (e) {
			if (typeof activeOperatorCall == "undefined") {
				delete operatorCalls[e.call.number()];
				nOperatorCalls--;
				if (nOperatorCalls == 0) {
          call.hangup(); // see http://voximplant.com/docs/references/appengine/Call.html#hangup for details
        }
      }
    });
	
    operatorCalls[j].addEventListener(CallEvents.Connected, function(e) {
	    delete operatorCalls[e.call.number()];
	    activeOperatorCall= e.call;
      VoxEngine.sendMediaBetween(call, e.call); // see http://voximplant.com/docs/references/appengine/VoxEngine.html#sendMediaBetween for details
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
    VoxEngine.sendMediaBetween(call, call2); // join incoming call and call to user/ext
  });
	call2.addEventListener(CallEvents.Disconnected, VoxEngine.terminate);
}

VoxEngine.addEventListener(AppEvents.CallAlerting, function (e) {
  callerid = e.callerid; // store Caller ID of the call
  displayName = e.displayName; // store Display Name of the call
	e.call.addEventListener(CallEvents.Connected, function (e) {
    // Check if call was made during working hours
    var d = new Date( new Date().getTime() + GMT_offset * 3600 * 1000),
        day = d.getUTCDay(),
        hour = d.getUTCHours();
    Logger.write("Day: "+day+" Hour: "+hour);
    if (hour >= workingHours[day][0] && hour < workingHours[day][1]) {
      // Working-hours
      e.call.startPlayback(workingHoursGreetingURL, false); // standard greeting playback, see http://voximplant.com/docs/references/appengine/Call.html#startPlayback for details
      e.call.record();
    } else {
      // Non-working hours
      nonWorkingHours = true;
      e.call.startPlayback(nonWorkingHoursGreetingURL, false); // non-working hours greeting playback
    }		
  });
  
  e.call.addEventListener(CallEvents.Disconnected, function (e) {
    VoxEngine.terminate();  // Terminate session
  });
                             
	e.call.addEventListener(CallEvents.PlaybackFinished, function (e) {
    // If call while working hours give some time to enter the extension before calling operators
    if (!nonWorkingHours) {
      operatorTimer = setTimeout(function() {
        forwardCallToOperator(e.call);
			}, TIMEOUT);
    } else VoxEngine.terminate(); // otherwise - terminate session 
  });
                             
	e.call.addEventListener(CallEvents.ToneReceived, function (e) {
    // Handle tones to check entered extension
		e.call.stopPlayback(); // stop playback of the greeting
    input += e.tone; // add digit until 3 digits entered
    if (input.length == 3) {
      forwardCallToExtension(e.call, input); // forward the call to extension
    }
	});
    
  e.call.handleTones(true); // Enable tones processing
	e.call.answer(); // Answer incoming call
});