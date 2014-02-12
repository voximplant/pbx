#VoxEngine scenarios for Cloud PBX functionality 

This project lets developers implement Cloud PBX using [VoxImplant](http://voximplant.com/) platform. This README file describes how to use the provided [VoxEngine](http://voximplant.com/help/faq/what-is-voxengine/) scenarios and [VoxImplant Application Rules](http://voximplant.com/docs/quickstart/10/understanding-users-applications-and-rules/) to process calls according to standard PBX scenarios: IVR for incoming call, forwarding call to operators after greeting playback, calls between PBX extensions, calls from PBX extensions to phone numbers, call recording, etc. The only thing you need to start building your Cloud PBX is VoxImplant developer account, you can get it for free at [https://voximplant.com/sign-up/](https://voximplant.com/sign-up/)

For this project we consider that:
<ol>
<li>VoxImplant Application Users = PBX extensions</li>
<li>PBX extensions can be registered using SIP or <a href="https://voximplant.com/docs/references/websdk/">VoxImplant Web SDK</a></li>
<li>Script modification is required if you want to forward incoming calls to real phone numbers instead of SIP/Web SDK</li>
<li>Extensions that will be used as operators receiving incoming calls can be specified in configuration variable</li>
<li>Incoming call forwarded to all operators simultaneously (in parallel) , the caller will be connected with the first operator who answers the call
</ol>

This project contains 3 types of scenarios used for call processing:
* pbx_in - script is used to process incoming calls.
* pbx_local - script is used to process local calls between PBX extensions.
* pbx_out - script is used to process outbound calls to PSTN.

Quickstart
After you successfully created and activated your VoxImplant developer account you need to login into [VoxImplant admin interface](https://manage.voximplant.com/) and complete these steps to have your PBX up and running:
<ol>
<li>Create 3 scenarios in Scenarios tab by copying and pasting the code provided ( pbx_in, pbx_local, pbx_out ) </li>
<li>Create couple of users in Users tab, please remember that they will be registered on VoxImplant as PBX extensions if you use SIP phones to make/receive calls</li>
<li>Customize scenarios according to your requirements and users you created</li>
<li>Create application in Applications tab and specify Rules for the application to launch scenarios according to the specified Rule's Pattern</li>
<li>Register your SIP phones using users credentials you specified (2nd step), full username will look like sip:USERNAME@APPNAME.ACCOUNTNAME.voximplant.com. They should act like PBX extensions, so you should be able to make calls between extensions and to phone numbers at the moment./li>
<li>Depending on Rules you specified (4th step) you can also make a call to PBX from outside to test incoming call scenario. If you want to connect existing phone number using SIP or allow receiving SIP calls you should authorize IP address/network used for that at [Settings->SIP](https://manage.voximplant.com/#sip)</li>
</ol>
