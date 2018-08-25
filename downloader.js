var request = require("request");
// var events = require("events");
var path = require("path");
// var url = require("url");
var fs = require('fs');
var Progress = require('cli-progress');
var unzip = require('unzip');


// path.parse("C:/users/admin/file.zip")
// { root: 'C:/',
//     dir: 'C:/users/admin',
//     base: 'file.zip',
//     ext: '.zip',
//     name: 'file' }

function getFileName(fileUrl) {
    return fileUrl.split('/').pop().split('#')[0].split('?')[0];
}

function getDownloadLocation(url) {
    return path.join(process.cwd(), getFileName(url))
}

function Downloader(fileUrl, options, callback) {
    var startTime = new Date();

    if (!options) {
        options = {}
    }
    var filePath = options.filePath || getDownloadLocation(fileUrl);
    var autoStart = options.start || true;
    var resume = options.resume || true;
    var retryInterval = options.retryInterval || 5000;
    var progress = options.progress || true;
    var autoUnzip = options.unzip || true;  // if the file is a .zip, extract the contents
    var userAgent = options.userAgent || "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 Chrome/68.0.3440.59 Safari/537.36 Nodejs/6";
    var overwrite = options.overwrite || false;
    var verbage = options.verbage || false;
    var resumable=false;

    var stats = {
        time: 0,
        filePath: filePath,
        url: fileUrl,
        bytesDownloaded: 0,
        remoteFileSize: 0
    };

    var rOptions = {
        method: 'GET',
        uri: fileUrl,
        forever: true, // http keep-alive
        headers: {"User-Agent": userAgent},
        gzip: true
    };

    function fin() {
        now = new Date().getTime();
        stats.time = (now - startTime) / 1000;
        callback(stats);
    }

    function setRemoteFileSize(callback){
        var options = {
            uri : fileUrl,
            method : 'HEAD',
            followAllRedirects : true,
            followOriginalHttpMethod : true,
            headers : {"User-Agent" : userAgent}
        }
        r = request(options)
            .on("response",function(res){
                stats.remoteFileSize = parseInt(res.headers['content-length'], 10);
                callback();
            })
            .on("err",function(err){
                throw err;
            })
    }

    function decomp(file, callback) {
        if (autoUnzip) {
            if(verbage){console.log("Extracting ", filePath)}
            var extractor = unzip.Extract({path: path.parse(filePath).dir});
            fs.createReadStream(file).pipe(extractor);
            extractor.on('error', function (err) {
                throw err;
            });
            extractor.on('close', function () {
                callback()
            });
        }
        else {
            callback()
        }
    }

    var file; // the download buffer
    var bar;
    function continueDownload() {

        if(verbage){console.log(fileUrl,"=>",filePath)};

        if(!file){
            // the checkResumeState already added stats.bytesDownloaded, so don't worry
            file = fs.createWriteStream(filePath+".temp",{flags:"a+"})
                .on("finish",function(){
                    fs.rename(filePath+".temp",filePath,function(err){
                        if (filePath.slice(-4).toLowerCase() == ".zip") {
                            decomp(filePath, fin)
                        }
                        else {
                            fin();
                        }
                    })
                });
        }
        else{
            // must be a resume here.
            rOptions.headers.Range="bytes="+stats.bytesDownloaded+"-";
            if(verbage){console.log('resuming..')}
        }

        if (options.progress && ! bar) {
            bar = new Progress.Bar({}, Progress.Presets.shades_classic);
            bar.start(stats.remoteFileSize, 0);
        }

        r=request(rOptions)
            .on('data', function (chunk) {
                file.write(chunk, 'binary', function () {});
                stats.bytesDownloaded += chunk.length;
                if (bar) {
                    bar.update(stats.bytesDownloaded)
                }
            }).on('end', function () {
                if (stats.bytesDownloaded==stats.remoteFileSize){
                    if (bar) {bar.stop()}
                    if (verbage) {console.log("Download complete.")};
                    file.end();
                    // the callback will commence upon file write complete.
                }
                else{
                    if(verbage){console.log("connection interrupted")}
                    continueDownload()
                }
            }).on('error', function (err) {
                throw err;
                if (bar) { bar.stop()};
            });
    }

    function checkResumeState(next){
        fs.exists(filePath+".temp",function(exists){
            if(exists){
                if(verbage){"temp file found, resuming download"}
                fs.stat(filePath+".temp",function(fileStats){
                    stats.bytesDownloaded=fileStats.size;
                    resumable=true;
                    rOptions.headers["Range"]= "bytes="+String(stats.bytesDownloaded)+"-";
                    next();
                })
            }
            else{
                next();
            }
        })
    }

    function start() {
        setRemoteFileSize(function () {
            fs.exists(filePath, function (exists) {
                if (exists) {
                    // see if its the right size
                    if (overwrite) {
                        continueDownload()
                    }
                    else {
                        fs.stat(filePath, function (err, fileStats) {
                            if (fileStats.size == stats.remoteFileSize) {
                                if (verbage) {
                                    console.log("Local file equal to remote file.", fileStats.size, "==", stats.remoteFileSize)
                                };
                                fin();
                            }
                            else {
                                if (verbage) {
                                    console.log("Local file not equal to remote file.", fileStats.size, "!=", stats.remoteFileSize)
                                };
                                continueDownload()
                            }
                        })
                    }
                }
                else {
                    continueDownload()
                }
            });
        })
    }

    checkResumeState(start)
}

module.exports = Downloader;