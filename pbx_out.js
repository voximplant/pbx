/** 
 * Make call to phone number, use officeNumber as a Caller ID
 * Rule should be specified for VoxImplant application to run the script
 * Default pattern: [0-9]+
 */
var officeNumber = "xxxx"; // Insert here your number

VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
        // make call to PSTN, see http://voximplant.com/docs/references/appengine/VoxEngine.html#callPSTN for details
        var call2 = VoxEngine.callPSTN(e.destination.substring(1), officeNumber);
        // use easyProcess function and enable call recording, see http://voximplant.com/docs/references/appengine/VoxEngine.html#easyProcess for details
        VoxEngine.easyProcess(e.call, call2, function(c, c2) {
                c.record();
        });
});
