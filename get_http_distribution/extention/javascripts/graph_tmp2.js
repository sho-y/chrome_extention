var hash_timestamp={};//timestampをキーにしてidを格納
var timestamp_array=[];//timestampを昇順に格納した配列
var hash_url={};//ドメインをキーにしてidを格納
var hash={};//idをキーにしたデータオブジェクト[tab_id,url,timestamp]
var array_id=[];//チェックボックスから取得したid


var src={}; //データベースから取得した選択idのリソース[primarykey,hash_id,type,size]
var tmp_graph={};//グラフ作成用に各rangeの数を集計{100:~個,200:〜個...}
var graph_data=[];//グラフ作成用の本データ[[x1,y1],[x2,y2],[x3,y3]...]
var max_num=0;//ファイルサイズの最大値（グラフ作成時に必要）
var xaxis_label=[];//グラフのx軸ラベル

var tmp_type={};

console.log("load");


  $.ajax({
    type: "get",
    url : "http://localhost:4567/get_hash/",
    success: function(hash_res){
      str_table=init_data(hash_res); //データベースの値を各ハッシュテーブルに格納、テーブル作成
      $("#data").html(str_table);

      $("#timestamp").click(function(){ //Timestampを昇順に並べてテーブルに配置
        var str='';
        for(var i=0;i<timestamp_array.length; i++){
          var id=hash_timestamp[timestamp_array[i]];
          str+=make_table(hash[id],id);
        }
        $("#data").html(str);
      });

      $("#url").click(function(){  //ドメイン毎に並べてテーブルに配置
        var str='';
        for(var domain in hash_url){
          console.log(domain)
          for(var i=0; i<hash_url[domain].length; i++){
            var id=hash_url[domain][i];
            str+=make_table(hash[id],id);
           }
        }
        $("#data").html(str);
      });

      $("#search").click(function(){  //検索窓に入力された文字列を含むドメインのテーブルを表示
        var str='';
        for(var domain in hash_url){
          if(judge_domain($(".search-query").val(),domain)){
          for(var i=0; i<hash_url[domain].length; i++){
            var id=hash_url[domain][i];
            str+=make_table(hash[id],id);
           }
         }
        }
        $("#data").html(str);
      });      

      $("#filter").click(function(){

        //選択されたチェックボックスのIDを取得(IDはname名になっている)
        array_id.length=0;
        var id_chk=$(".hash_table:checked");
        for(var i=0;i<id_chk.length;i++){
          array_id.push(Number($(id_chk[i]).attr("name")));
        }

          var choose_type=[];
          var flag=true;
          //allかchooseか
          //chooseならばチェックされているものを取得
          if($("input[name=filter_type]:checked").val()!="all"){
            flag=false;
            var type_chk=$(".content_type:checked");
            for(var i=0;i<type_chk.length;i++){
              choose_type.push($(type_chk[i]).attr("name"));
            }
          }

        //グラフ用データ初期化
        tmp_graph={};
        graph_data=[];
        max_num=0;
        xaxis_label=[];



        //選択されたIDに対応するリソースデータを取得
        $.ajax({
            type: "post",
            url : "http://localhost:4567/get_array/",
            data:JSON.stringify(array_id),
            dataType:'json',
            success: function(src_res){
              src=src_res;
              src.forEach(function(e){   //ID毎に配列化されているため
                e.forEach(function(v){   //リソースオブジェクトを一つずつ取り出す
                  if(flag || judge_type(choose_type, v.type)){
                  count4graph(v.size);   //リソースのサイズをカウント
                  }
                  count4type(v.type);
                });
              });
              make_graphdata();   //flotrグラフのデータ型に成形
              make_label();   //x軸の値にラベルを対応させる[0,1,2,3…10,20,30,…]
              drawFlotr();  //グラフ描画
            },
            error:{
        
            }
        });

       });

      //全選択
      $("#selectall").click(function(){
        $(".hash_table").attr("checked",true);
      });

      //全解除
      $("#deselectall").click(function(){
        $(".hash_table").attr("checked",false);
      });

      $("#all").click(function(){
        $("#type_table").addClass("hidden");
      });

      $("#choose").click(function(){
        $("#type_table").removeClass("hidden");
      });

    },
    error: function(e){
    }
  });

//////////////    サイドバー用関数   //////////////////

function init_data(hashs){
  var str='';

  hashs.forEach(function(v){
    str+=make_table(v,v.id);

    hash_timestamp[Number(v.timestamp)]=v.id; //タイムスタンプ順ににhashIDを格納

    timestamp_array.push(Number(v.timestamp)); //ソート用にtimestampの配列を作成

    if(!hash.hasOwnProperty(v.id)){hash[v.id]={};}
    hash[v.id]={ //IDをキーにしたデータオブジェクトに成形
      domain:v.domain,
      tab_id:v.tab_id,
      timestamp:v.timestamp,
      url:v.url
    };

    if(!hash_url.hasOwnProperty(v.domain)){hash_url[v.domain]=[];}
    hash_url[v.domain].push(v.id); //ドメインをキーにした配列を作成 
    });

  timestamp_array.sort(); //timestampを昇順にソート
  return str;
}

function make_table(data,id){
    if(data.url.length>35){
      var url=data.url.substring(0,34)+"...";
    }
    else{
      var url=data.url;
    }  
    var str='<tr><th><input type="checkbox" class="hash_table" name="'+id+'"></th><th>'+id+'</th><th>'+data.timestamp+'</th><th>'+url+'</th></tr>'; 
    return str;
}

function judge_type(choose_type, content_type){
  var count_flag=false;
    choose_type.forEach(function(v){
      var reg=new RegExp(v);
      if(content_type.match(reg)){
        count_flag=true;
      };
    });
return count_flag;
}

function judge_domain(word,domain){
    var count_flag=false;
    var reg=new RegExp(word);
    if(domain.match(reg)){
      count_flag=true;
    };
return count_flag;
}



////////////////   グラフ用関数    ///////////////

function count4graph(size){

  //リソースサイズからどこのレンジに属するかを計算してカウントする
  //レンジは[(x軸:サイズ)0~10:0~10 11~19:20~100 20~28:200~1000]

  if(size>=10){
    var ki=Math.pow(10,size.length-1);   //サイズの桁数と同じ桁の10の乗数を作成
    var num=parseInt(size/ki)+(size.length-1)*10-(size.length-1); //レンジを判定
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
}

function count4type(type){
  if(!!tmp_type.hasOwnProperty(type) === false){
    tmp_type[type]=0;
  }
  tmp_type[type]++;

}


function make_graphdata(){
  for(var num_x in tmp_graph){
    graph_data.push([Number(num_x)+0.55,tmp_graph[num_x]]);
  }
}

function make_label(){
  var xaxis_label_tmp=0;
  for(var i=0;i<=max_num;i++){  
    xaxis_label.push([i,(xaxis_label_tmp/1000>=1)? xaxis_label_tmp/1000+"K" : String(xaxis_label_tmp)]);
    xaxis_label_tmp=xaxis_label_tmp+(Math.pow(10,String(xaxis_label_tmp).length-1));
  }
}

function drawFlotr() {

  $("#graph").html("");

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
  console.log(opt);
  var d=[];
  d.push({
    data: graph_data, 
    label: "Content-size", 

  });
  console.log(d);
  var graph = Flotr.draw($("#graph")[0], d, opt);

}