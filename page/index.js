var async=require('async');
var Util = require('../util/util.js');

module.exports = function(req, res, next, viewPath){
    var query = req.query;
    function commonApi(callback){
        Util.get('http://www.weather.com.cn/data/sk/101010100.html', {}, function(data) {
            callback(null, data);
        }, function(e) {
            callback(null, e);
        });
    }

    async.parallel({
        getWeatherData: function(callback) {
            commonApi(callback);
        }
    }, function(err, results) {
        results.query = query;
        res.render(viewPath, results);
    })
};
