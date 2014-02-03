/** 
* Make call to another extension and start recording after call connected
* See http://voximplant.com/docs/references/appengine/VoxEngine.html#forwardCallToUser for details
* Rule should be specified for VoxImplant application to run the script using the following Pattern: 1[0-9]{2} 
*/
VoxEngine.forwardCallToUser(function(call, call2){call.record();});