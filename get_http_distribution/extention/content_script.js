var tmp={};
var res={};

window.onload=function(){
var port = chrome.extension.connect({name:'test'});
port.postMessage({action:"GetStatus"});
var doc_start=document.getElementById("start");
var doc_stop=document.getElementById("stop");

doc_start.addEventListener("click", function() {
	doc_start.className="dis btn start";
	doc_start.disabled=true;
	doc_start.value="Now collecting";
	document.getElementById("result").innerHTML="";
	doc_stop.className="btn stop";
	doc_stop.disabled=false;
    port.postMessage({action:"collectNetworkLog"});
}, false);

doc_stop.addEventListener("click", function() {
	doc_start.className="btn start";
	doc_start.disabled=false;
	doc_start.value="Start to collect Log";
	doc_stop.className="dis btn stop";
	doc_stop.disabled=true;
    port.postMessage({action:"RetrieveNetworkLog"});

}, false);

document.getElementById("graph").addEventListener("click", function() {
	window.open("./get_http_data.html",null);
},false);


port.onMessage.addListener(function(msg) {
	if(msg=="start"){
		doc_start.className="dis btn start";
		doc_start.disabled=true;
		doc_stop.disabled=false;
		doc_start.value="Now collecting";
		doc_stop.className="btn stop";
	}
	else{
	tmp={};
	res={};
	for(var i in msg){
		for(var l=0;l<msg[i].length;l++){
			if(!!tmp.hasOwnProperty(i) === false) {
       		 tmp[i] = [];
      		}
			tmp[i].push(JSON.parse(msg[i][l]));
		}
	}

	res=remake(tmp);
	request();
	}
});

function remake(data){ //タブ毎にmainframe以下のものを格納
	var dict = {};
	var key = null;
	var array_main_frame=[];
	for(var tab_id in data){
		var flag=0;
		array_main_frame.length=0;
		console.log(data[tab_id])
		for (var i=0; i<data[tab_id].length; i++) {
			var obj = data[tab_id][i];
			console.log(obj.type)
			if(obj.type=="main_frame"){
				flag=1;
				array_main_frame.push(Number(obj.requestId));
				key = tab_id+"-"+obj.requestId;	
				dict[key]={		
				resource : [],
				tab_id : tab_id,
				url : obj.url,
				domain : obj.url.split(/\//)[2],
				timestamp : Math.floor(obj.timeStamp),
				};
				var tmp_x = {};
				obj.responseHeaders.forEach(function(v){
					tmp_x[v.name.toUpperCase()] = v.value;
				});
				if ("CONTENT-LENGTH" in tmp_x) {
					var x = {type: tmp_x["CONTENT-TYPE"], size: tmp_x["CONTENT-LENGTH"]};
					dict[key].resource.push(x);
				}else{
					var x = {type: tmp_x["CONTENT-TYPE"], size: "0"};
					dict[key].resource.push(x);
				}
			}
		}
		if(flag==1){
			array_main_frame.push(999999999);
			array_main_frame.sort(function(a,b){return a-b;});
			console.log(array_main_frame);
			var l=0;
			for (var i=0; i<data[tab_id].length; i++) {
				var obj = data[tab_id][i];
				if(obj.requestId>=array_main_frame[l] && obj.requestId<array_main_frame[l+1]){
					var tmp_x = {};
					key=tab_id+"-"+array_main_frame[l];
					obj.responseHeaders.forEach(function(v){
						tmp_x[v.name.toUpperCase()] = v.value;
					});
					if ("CONTENT-TYPE" in tmp_x && "CONTENT-LENGTH" in tmp_x) {
						var x = {type: tmp_x["CONTENT-TYPE"], size: tmp_x["CONTENT-LENGTH"]};
						dict[key].resource.push(x);
					}else{
						console.log("not-found");
					}
				}else if(obj.requestId>=array_main_frame[l+1]){
					l=l+1;
					var tmp_x = {};
					key=tab_id+"-"+array_main_frame[l];
					obj.responseHeaders.forEach(function(v){
						tmp_x[v.name.toUpperCase()] = v.value;
					});
					if ("CONTENT-TYPE" in tmp_x && "CONTENT-LENGTH" in tmp_x) {
						var x = {type: tmp_x["CONTENT-TYPE"], size: tmp_x["CONTENT-LENGTH"]};
						dict[key].resource.push(x);
					}else{
						console.log("not-found");
					}
				}
			}
		}
	}
	console.log("---------------------------------------------------");
	console.log(dict);
	return dict;

}

function request() {
    var req = new XMLHttpRequest();
    req.open("POST", "http://localhost:4567/insert/", true);
    req.onreadystatechange = function(){onReadystatechange(req)};
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    req.onload = function(e){console.log(e)};
    req.send(JSON.stringify(res));

 }


function onReadystatechange(req){
	if (req.readyState === 4) {  ;   
		if (req.status === 200 ) { // HTTPステータスコード200 は「リクエスト成功」を表す
        	document.getElementById("result").innerHTML="complete!";
      	}
      	else{
      		document.getElementById("result").innerHTML="error...";
      	}
    }
}
};


