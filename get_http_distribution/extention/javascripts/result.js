//View Component
var view_Table={} , view_Filter={} , view_Graph={};

//Connector
var Connector={};

//----------view_Table------------//
view_Table.init = function(selector){
	this.selector=selector;
	this.data={
		hash_timestamp:{},//timestampをキーにしてidを格納
		timestamp_array:[],//timestampを昇順に格納した配列
		hash_url:{},//ドメインをキーにしてidを格納
		hash:{}//idをキーにしたデータオブジェクト[tab_id,url,timestamp]
	};
	$(this).trigger("get_hash");
	this.setHandler();
}


view_Table.makedata = function(hashs){
  var str='';

  hashs.forEach(function(v){
    str+=this.make_table(v,v.id);

    this.data.hash_timestamp[Number(v.timestamp)]=v.id; //タイムスタンプ順ににhashIDを格納

    this.data.timestamp_array.push(Number(v.timestamp)); //ソート用にtimestampの配列を作成

    if(!this.data.hash.hasOwnProperty(v.id)){this.data.hash[v.id]={};}
    this.data.hash[v.id]={ //IDをキーにしたデータオブジェクトに成形
      domain:v.domain,
      tab_id:v.tab_id,
      timestamp:v.timestamp,
      url:v.url
    };

    if(!this.data.hash_url.hasOwnProperty(v.domain)){this.data.hash_url[v.domain]=[];}
    this.data.hash_url[v.domain].push(v.id); //ドメインをキーにした配列を作成 
    }.bind(this));
  this.data.timestamp_array.sort(); //timestampを昇順にソート
  this.render(str);
}


view_Table.make_table=function(data,id){
    if(data.url.length>35){
      var url=data.url.substring(0,35)+"...";
    }
    else{
      var url=data.url;
    }  
    var str='<tr><th><input type="checkbox" class="hash_table" name="'+id+'"></th><th>'+id+'</th><th>'+data.timestamp+'</th><th><a href="'+data.url+'" target="_blank">'+url+'</a></th></tr>'; 
    return str;
}


view_Table.judge_domain=function(word,domain){
    var count_flag=false;
    var reg=new RegExp(word);
    if(domain.match(reg)){
      count_flag=true;
    };
return count_flag;
}


view_Table.render = function(str){
	this.selector.find("tbody").html(str);
}


view_Table.setHandler=function(){
	this.selector.find("#timestamp").click(function(){
		var str='';
        for(var i=0;i<this.data.timestamp_array.length; i++){
          var id=this.data.hash_timestamp[this.data.timestamp_array[i]];
          str+=this.make_table(this.data.hash[id],id);
        }
        this.render(str);
	}.bind(this));

	this.selector.find("#url").click(function(){
		var str='';
        for(var domain in this.data.hash_url){
          for(var i=0; i<this.data.hash_url[domain].length; i++){
            var id=this.data.hash_url[domain][i];
            str+=this.make_table(this.data.hash[id],id);
           }
        }
        this.render(str);
	}.bind(this));

	this.selector.find("#search").click(function(){
        var str='';
        for(var domain in this.data.hash_url){
          if(this.judge_domain(this.selector.find(".search-query").val(),domain)){
          for(var i=0; i<this.data.hash_url[domain].length; i++){
            var id=this.data.hash_url[domain][i];
            str+=this.make_table(this.data.hash[id],id);
           }
         }
        }
        this.render(str);
	}.bind(this));	

	this.selector.find("#selectall").click(function(){
        this.selector.find(".hash_table").attr("checked",true);
    }.bind(this));

    this.selector.find("#deselectall").click(function(){
        this.selector.find(".hash_table").attr("checked",false);
    }.bind(this));

}
view_Table.get_id=function(){
    //選択されたチェックボックスのIDを取得(IDはname名になっている)
    var id_array=[];
    var id_chk=this.selector.find(".hash_table:checked");
    for(var i=0;i<id_chk.length;i++){
      id_array.push(Number($(id_chk[i]).attr("name")));
    }
    return id_array;
}



//----------view_Filter------------//
view_Filter.init=function(selector){
	this.selector=selector;
	this.setHandler();
}

view_Filter.setHandler=function(){
	this.selector.find("#all").click(function(){
        this.selector.find("#type_table").addClass("hidden");	
	}.bind(this))
	this.selector.find("#choose").click(function(){
        this.selector.find("#type_table").removeClass("hidden");	
	}.bind(this))

	this.selector.find("#filter").click(function(){
        $(this).trigger("filter");	
	}.bind(this))
}
view_Filter.get_type=function(){
    var type_array=[];
    //チェックされているものを取得
    var type_chk=this.selector.find(".content_type:checked");
    for(var i=0;i<type_chk.length;i++){
      type_array.push($(type_chk[i]).attr("name"));
    }
    return type_array;
}
view_Filter.allorchoose=function(){//allかchooseか
	return this.selector.find("input[name=filter_type]:checked").val();
}


//---------Graph-----------//
view_Graph.init=function(selector){
	this.selector=selector;
}
view_Graph.render=function(data){
	console.log(data);
    var tmp=this.count4graph(data);   //リソースのサイズをカウント
    var graph_data=this.make_graphdata(tmp[1]);   //flotrグラフのデータ型に成形
    var xaxis_label=this.make_label(tmp[0]);   //x軸の値にラベルを対応させる[0,1,2,3…10,20,30,…]
    this.drawFlotr(xaxis_label,graph_data);  //グラフ描画
    $("#resource").html("number of resources : "+tmp[2]+"<br>total content-length : "+this.judge_unit_byte(tmp[3],0));
}

view_Graph.count4graph=function(data){
  var num_resource=data.length;
	var tmp_graph={};
  var max_num=0;
  var sum_resource=0;
	data.forEach(function(e){   //リソースオブジェクトを一つずつ取り出す
        var size=Number(e.size); 
        sum_resource=sum_resource+size;
        console.log(e.type)
		//リソースサイズからどこのレンジに属するかを計算してカウントする
		//レンジは[(x軸:サイズ)0~10:0~10 11~19:20~100 20~28:200~1000]
		if(size<0){return;}
		if(size>=10){
			var tmp_size=size;
			for(var unit=0;tmp_size/1024>=1;){
			  	unit=unit+1;
			  	tmp_size=tmp_size/1024;
			}
			if(tmp_size>=900){tmp_size=900;}
			tmp_size=String(parseInt(tmp_size));
			var unit_ki=String(Math.pow(1000,unit));
			var unit_base=(unit_ki.length-1)*10-(unit_ki.length-1);
			var ki=Math.pow(10,tmp_size.length-1); 
			var num=unit_base+parseInt(tmp_size/ki)+(tmp_size.length-1)*10-(tmp_size.length-1); 

		  if(!!tmp_graph.hasOwnProperty(num) === false) {
		    tmp_graph[num] = 0;
		  }
		  tmp_graph[num]++;
		}

		else{
		  var num=size;
		  if(!!tmp_graph.hasOwnProperty(num) === false) {
		    tmp_graph[num] = 0;
		  }
		  tmp_graph[num]++;
		}
		if(max_num<num){max_num=num;}   //ラベル用に最大値を取得
 	});

 	return [max_num,tmp_graph,num_resource,sum_resource]

}

view_Graph.judge_unit_byte=function(size,count){
    if(size/1024>=1){
    return this.judge_unit_byte(size/1024,count+1);
  }
  else{
    var unit=["B","KB","MB","GB","TB"];
    return size+unit[count];
  }
}


view_Graph.make_graphdata=function(tmp_graph){
	var graph_data=[];
  for(var num_x in tmp_graph){
    graph_data.push([Number(num_x)+0.55,tmp_graph[num_x]]);
  }
  return graph_data;
}

view_Graph.make_label=function(max_num){
  var xaxis_label_tmp=0;
  var xaxis_label=[];
  for(var i=0;i<=max_num+1;i++){  
    xaxis_label.push([i,judge_unit(xaxis_label_tmp,0)]);
    xaxis_label_tmp=xaxis_label_tmp+(Math.pow(10,String(xaxis_label_tmp).length-1));
  }
  return xaxis_label;

  function judge_unit(size,count){
  	if(size/1000>=1){
		return judge_unit(size/1000,count+1);
	}
	else{
		var unit=["","K","M","G","T"];
		return size+unit[count];
	}
  }
}

view_Graph.drawFlotr=function(xaxis_label,graph_data){

  $("#graph").html("");
  $("#graph").width((xaxis_label.length*32<500)? 500 : xaxis_label.length*32);

  var  opt = { //グラフの軸設定
    title: 'Distribution of HTTP Content-size',
    xaxis: {
      min:0,
      notics:5,
      ticks:xaxis_label,
      title: 'size[bytes]'
    },
    yaxis: {
      min: 0,
      title: 'count'
    },
    legend: {
      position: 'nw'
    },
    HtmlText: false,
    grid: {
      backgroundColor: 'white'
    },
    bars : {
        show : true,
        shadowSize : 0,
        barWidth : 1.0,
        LineWidth:1.0
      }
  }
  var d=[];
  d.push({
    data: graph_data, 
    label: "Content-size", 

  });
  var graph = Flotr.draw($("#graph")[0], d, opt);
  $(".graph_download").html("<input type='button' id='download_btn' class='btn btn-primary' value='save as Image'>")
  $("#download_btn").click(function(ev){
    graph.download.saveImage('png')
  })


}

//DB connector
Connector.get=function(activity){
	var url="http://localhost:4567/"+activity+"/";
	$.ajax({
    	type: "get",
    	url : url,
    	success: function(res){
    		$(Connector).trigger(activity,new Array(res));
    	},
    	error: function(e){
    	}
  	});
}

Connector.post=function(activity,data){
	var url="http://localhost:4567/"+activity+"/";
	$.ajax({
    	type: "post",
    	data: data,
    	url : url,
    	success: function(res){
    		$(Connector).trigger(activity,new Array(res));
    	},
    	error: function(e){
    	}
  	});
}


window.onload=function(){

//Controller
$(view_Table).on("get_hash",function(e){
	console.log("get_hash");
	Connector.get("get_hash");
});
$(Connector).on("get_hash",function(e,data){
	view_Table.makedata(data);
});
$(Connector).on("get_src",function(e,data){
	view_Graph.render(data);
});
$(view_Filter).on("filter",function(e){
	var id_array=view_Table.get_id();
	console.log(id_array);
	var type_array=[];
	var allorchoose=view_Filter.allorchoose();
	if(allorchoose=="choose"){
		type_array=view_Filter.get_type();
		console.log(type_array);
	}
	Connector.post("get_src",JSON.stringify({id_array:id_array,type_array:type_array}))
})

	view_Filter.init($(".filter"));
	view_Graph.init($("#graph"));
	view_Table.init($(".table"));

};






