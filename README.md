#VoxEngine scenarios for Cloud PBX functionality 

This project lets developers implement Cloud PBX using [VoxImplant](http://voximplant.com/) platform. This README file describes how to use the provided [VoxEngine](http://voximplant.com/help/faq/what-is-voxengine/) scenarios and VoxImplant Application Rules to process calls according to standard PBX scenarios: IVR for incoming call, forwarding call to operators after greeting playback, calls between PBX extensions, calls from PBX extensions to phone numbers, call recording, etc. The only thing you need to start building your Cloud PBX is VoxImplant developer account, you can get it for free at [https://voximplant.com/sign-up/](https://voximplant.com/sign-up/)

For this project we consider that:
1. VoxImplant Application Users = PBX extensions 
2. PBX extensions can be registered using SIP or [VoxImplant Web SDK](https://voximplant.com/docs/references/websdk/)
3. Script modification is required if you want to forward incoming calls to real phone numbers instead of SIP/Web SDK 
4. Extensions that will be used as operators receiving incoming calls can be specified in configuration variable

This project contains 3 types of scenarios used for call processing:
* pbx_in - script is used to process incoming calls.
* pbx_local - script is used to process local calls between PBX extensions.
* pbx_out - script is used to process outbound calls to PSTN.
