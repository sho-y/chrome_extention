var aNetworkLog = {};
var collect_flag=0;
var status="stop";

chrome.webRequest.onCompleted.addListener(function(oCompleted) {
            if(collect_flag==1){

			var tabId=oCompleted.tabId;
            var sCompleted = JSON.stringify(oCompleted,null,2);
            
            if(!!aNetworkLog.hasOwnProperty(tabId) === false) {
       		 aNetworkLog[tabId] = [];
      		}

            aNetworkLog[tabId].push(sCompleted);
        }
        }
        ,{urls: ["http://*/*","https://*/*"]},["responseHeaders"]
 );

chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (message) {
        if (message.action == "RetrieveNetworkLog") {
            collect_flag=0;
            port.postMessage(aNetworkLog);
            aNetworkLog={};
            status="stop";
            // port.postMessage("hello");
        }
        if (message.action == "collectNetworkLog") {
            collect_flag=1;
            status="start";
            // port.postMessage("hello");
        }
        if (message.action == "GetStatus") {
            port.postMessage(status);
            // port.postMessage("hello");
        }
        
    });
});