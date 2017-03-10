/*--- 引入第三方模块 ---*/
var path = require("path"),
	request = require('request'),
    procexss = require('node-procexss'),
	express = require('express'),
	http = require('http'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	favicon = require('serve-favicon'),
	compression = require('compression');

var CONF = require("./conf"),
	doT = require("./lib/dot/index.js"),
	router = require('./router/index.js');

function do404(req, res) {
	var accept = req.headers.accept || "";
	if (~accept.indexOf("html") &&
		!(~accept.indexOf("json") || ~accept.indexOf("javascript"))
	) {
		res.send(404, '<!DOCTYPE HTML>'+
	'<html>'+
	'<head>'+
		'<meta charset="UTF-8">'+
		'<meta name="viewport" content="width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=0" />'+
		'<title>非常抱歉，您访问的页面不存在。From Node</title>'+
	'</head>'+
	'<body>'+
		'<h1>去哪儿车车</h1>'+
		'<h2>非常抱歉，您访问的页面不存在。</h2>'+
		'<dl>'+
			'<dt>您可以：</dt>'+
			'<dd>1. <a href="javascript:history.go(-1);">返回至刚才的页面</a>。</dd>'+
			'<dd>2. <a href="/">访问我们的首页</a></dd>'+
		'</dl>'+
	'</body>'+
	'</html>');
	} else {
		res.send(404);
	}
}

/*--- 相对路径转化 ---*/
if (CONF.docRoot[0] === '.') {
	CONF.docRoot = path.resolve(path.join(__dirname, CONF.docRoot));
}

var app = express();
app.set("views", CONF.docRoot);
app.engine("html", doT.__express);
app.set("view engine", "html");

// app.configure('production', function() {
// 	app.enable('view cache');
// 	app.set('json spaces', null);
// });

// ios7 会有bug
app.disable('etag');

// 由专用的express.favicon()中间件处理，并提为use最先调用。目的在于，直接处理，不打log，不执行next方法。
// app.use(favicon(path.resolve(path.join(CONF.docRoot, '/pc/favicon.ico'))));

// 用nginx
app.use(compression());
app.use(procexss());

app.use(cookieParser());

app.all('/check_url', function(req, res) {
	res.send(200);
});

/*--- 所有的 .jsp .html 请求都会到这个路由 具体在 rewrite.js里 ---*/
app.all(/^[^.]+\.(jsp|html)$/, function(req, res, next) {
	// healthcheck.html 不能用缓存 只能用static
	if (req.url === '/healthcheck.html') {
		next();
		return;
	}
	
	var actionPath = req.path.slice(1, req.path.lastIndexOf('.'));
	var viewPath = actionPath + '.html';
	
	var rt = router[actionPath];

	if (rt) {
		rt(req, res, next, viewPath);
	} else {
		res.render(viewPath, {
			request: req,
			response: res
		});
	}
});

app.listen(CONF.port);
