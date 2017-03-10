var http=require('http');
var Url =require("url");
var https = require('https');
var zlib = require("zlib");

exports.get = function(url, param, success, error) {
	var completed = false;
	var onsuccess = function(data){
		if(completed){
			return;
		}
		completed = true;
		clearTimeout(timeout);
		success && success.apply(null,arguments);
	};
	var onerror = function(e){
		if(completed){
			return;
		}
		completed = true;
		error && error.apply(null,arguments);
	};

	var urlObj = Url.parse(url);
	var response;
	var headers = [];

	headers["Content-Type"]= "application/json; charset=UTF-8";
	headers["Content-Length"] = Buffer.byteLength(param);
	headers["Accept-Encoding"] = "gzip, deflate";

	var opt={
		// host: "127.0.0.1",
		// port:8888,
		// path:url,
		hostname:urlObj.hostname,
		port    :urlObj.port,
		path    :urlObj.path,
		// headers :headers,
		method  : "GET"
	};
	var request = http.request(opt, function(_response) {
		var data, chunks = [];
		response=_response;
		
		var encoding = _response.headers['content-encoding'];
		if(encoding === 'undefined') {
			_response.setEncoding("utf-8");
		}

		data = "";
		_response.on("data", function(chunk) {
			chunks.push(new Buffer(chunk));
		});
		_response.on("end", function() {
			var buffer = Buffer.concat(chunks);
			if(encoding == 'gzip') {
				zlib.gunzip(buffer, function (err, decoded) {
                    data = decoded.toString();
                    // data = buffer.toString();
                    onsuccess(data,_response.statusCode);
                });
			} else if(encoding == 'deflate') {
				zlib.inflate(buffer, function (err, decoded) {
                    data = decoded.toString();
                    onsuccess(data,_response.statusCode);
                });
			} else {
				data = buffer.toString();
				onsuccess(data,_response.statusCode);
			}
		});
		_response.on("close", function() {
			onerror(new Error("http response:close"));
		});
		// 如果不绑定error事件  出现error会直接中断程序
		_response.on("error",function(e){
			e.stack='http response:'+e.stack;
			onerror(e);
		});
	// 如果不绑定error事件  出现error会直接中断程序
	}).on("error", function(e) {
            
		e.stack='http request:'+e.stack;
		onerror(e);
	});
	request.end();

	var timeout = setTimeout(function() {
		var e = new Error();
		if(response){
			response.destroy();
			e.stack="http response timeout";
		}else{
			request.abort();
			e.stack="http request timeout";
		}
		onerror(e);
	}, 23000);
}

