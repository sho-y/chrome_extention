require "rubygems"
require "sinatra"
require 'json'
require 'haml'
require 'sequel'


  Sequel::Model.plugin(:schema) 
  DB = Sequel.sqlite('./db/http_check.sqlite3')
  # DB = Sequel.sqlite('./db/all_test_db.sqlite3')
  # DB = Sequel.sqlite('test_db.sqlite3') //for unit test
  class Hsh < Sequel::Model  
      set_schema do  
        primary_key :id  
        text :tab_id
        text :url
        text :timestamp 
      end 
   unless table_exists?   
      create_table  
   end  
  end 

  class Domain < Sequel::Model  
      set_schema do 
        text :url
        integer :hash_id
        text :domain 

      end 
   unless table_exists?   
      create_table  
   end  
  end 

  class Src < Sequel::Model  
      set_schema do  
       primary_key :id  
       integer :hash_id
       text :type 
       text :size
     end  
   unless table_exists?  
     create_table  
   end  
  end 


post '/insert/' do 
  row_data = request.body.read
  res_data= JSON.parse(row_data)

  res_data.each{|var|
   hash_id= Hsh.insert(:tab_id => res_data[var[0]]["tab_id"], :url => res_data[var[0]]["url"], :timestamp=>res_data[var[0]]["timestamp"])
   
  if Domain.filter(:url => res_data[var[0]]["url"]).empty? then
   Domain.insert(:hash_id => hash_id, :url => res_data[var[0]]["url"], :domain=>res_data[var[0]]["domain"])
  end

   res_data[var[0]]["resource"].each{|resource|
    puts resource["type"]
    puts resource["size"]
    Src.insert(:hash_id => hash_id, :type => resource["type"], :size=>resource["size"])
   }
  }

   puts Hsh.all.map{|e|e.values}

  response["Access-Control-Allow-Origin"] = "*"
  content_type :json
return "OK"

end


get '/get_hash/' do 
  res=JSON.unparse(Hsh.join(Domain, :url => :url).all.map{|e|e.values})
  response["Access-Control-Allow-Origin"] = "*"
  content_type :json
return "#{res}"

end

post '/get_src/' do 
  @obj=Function.new
  row_data = request.body.read
  res_data= JSON.parse(row_data)
  
  db_data=@obj.get_data(res_data["id_array"],res_data["type_array"])

  db_data=JSON.unparse(db_data)
  response["Access-Control-Allow-Origin"] = "*"
  content_type :json
  return "#{db_data}"
end

class Function
def get_data(id_array,type_array)
  puts id_array
  puts type_array
  if id_array.class==Array && type_array.class==Array then
str="select * from srcs where ("
  i=1
id_array.each do |id|
  if i>1 then
    str+=" or "
  end
  str+="hash_id='"+id.to_s+"'"
  i+=1
end
str+=")"
if type_array.any? then
    str+=" and ("
    i=1
    type_array.each do |type|
      if type.class!=String then
        type="error"
      end
      if i>1 then
        str+=" or "
      end
      str+="type like '%"+type+"%'"
      i+=1
    end
    str+=")"
end
return Src.fetch(str).all.map{|e|e.values}
else
  return err=[]
end
end
end




