require "rubygems"
require 'net_res' 
require 'test/unit'

class Test_function < Test::Unit::TestCase
  def setup
    @obj=Function.new
  end
  def test_get_src
    id_array=[{:hoge=>"hoge"},14,"string",[1,2,3]]
    type_array=["string",14,{:hoge=>"hoge"},"audio",["video","other"]]
    test1= @obj.get_data(id_array,type_array)
    puts test1
  end
end




  #   test2= Src.where(:hash_id => id_array)

  #   str=""
  #   if type_array.any? then
  #   str+="test2.where("
  #   i=1
  #   type_array.each do |type|
  #     if i>1 then
  #       str+=" | "
  #     end
  #     str+="Sequel.like(:type, '%"+type+"%')"
  #     i+=1
  #   end
  #   str+=")"
  #   test2=eval(str)
  # end

  #   # test2= test2.where(Sequel.like(:type, '%html%') | Sequel.like(:type, '%image%') | Sequel.like(:type, '%javascript%'))
  #   test2= test2.all.map{|e|e.values}

  #   test3={:hash_id=>1,:id=>8,:type=>"text/css",:size=>"3955"}
    # assert_equal(test1[1],test3)
    # post '/get_src/', {:id_array => [1,2,3],:type_array => ["html","javascript"]}, "CONTENT_TYPE" => "application/json" 
    # puts JSON.parse(last_response.body)


       # type_array_list=["html","javascript","css","json","image","audio","video","flash","xml","x-cross-domain"]