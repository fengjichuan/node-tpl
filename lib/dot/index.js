var dot=require("./dot.js");
// dot.templateSettings
var fs=require("fs");
var CONF = require("../../conf");
var templateSettings=dot.templateSettings;
templateSettings.strip=false;


var Def=function(){};
Def.prototype={
	load:function(pathToFile){
		var text;
		// 直接throw error
		text=fs.readFileSync(this.__basePath+'/'+pathToFile,'utf8');

		return text;
	},
    loadHyFile:function(pathToFile){
        var text;
        // 直接throw error
        if(process.env.NODE_ENV!="dev" && process.env.NODE_ENV!="beta" && process.env.NODE_ENV!="production"){
            text=fs.readFileSync(this.__basePath+'/'+pathToFile,'utf8');
        }else{
            pathToFile = pathToFile.replace("/src","");
            text=fs.readFileSync(this.__basePath+'/'+pathToFile,'utf8');
        }

        return text;
    },
    envHost:function(){
        //不同环境返回不同域名
        var myHost = CONF.privateDomain || 'localhost:3000';
        if(process.env.NODE_ENV=="dev"){
            myHost = "cardev.qunar.com";
        }else if(process.env.NODE_ENV=="beta"){
            myHost = "carbeta.qunar.com";
        }else if(process.env.NODE_ENV=="production"){
            myHost = "car.qunar.com";
        }
        return myHost;
    }
};

dot.__express = function(fileName,option,callback){
	// View 对象
	var self=this;
	var text;
	var templateFunc;
	try{
		// 开启了view cache 并且
		// 模板还没过期
		if(self.dotExpire>Date.now()){
			text="";
			templateFunc=self.templateFunc;
		}else{
			text=fs.readFileSync(fileName, 'utf8');
			var _def=new Def();
			_def.__basePath=self.root;
			templateFunc=dot.template(text,null,_def);
			self.templateFunc=templateFunc;
			// 默认1分钟过期时间
			self.dotExpire=Date.now()+6e4;
		}
		callback(null,templateFunc(option));
	}catch(e){
		if(text==null){
			e.message='[error]template load :['+fileName+']: '+e.message;
			callback(e);
		}else if(templateFunc==null){
			e.message='[error]template compile :['+fileName+']: '+e.message;
			callback(e);
		}else{
			e.message='[error]template render :['+fileName+']: '+e.message;
			e.stack+="\n"+templateFunc.toString();
			callback(e);
		}
	}
};

module.exports=dot;
