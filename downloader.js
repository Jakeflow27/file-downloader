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

// Todo: implement the resume/retry

function getFileName(fileUrl) {
    return fileUrl.split('/').pop().split('#')[0].split('?')[0];
}

function getDownloadLocation(url) {
    return path.join(__dirname, getFileName(url))
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

    function decomp(file, callback) {
        if (autoUnzip) {
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

    function retry(fileStream, res) {
        var conentlength = parseInt(res.headers['content-length'], 10);
        //Range: bytes=0-1023
        var requestOptions = {
            method: "GET",
            url: fileUrl,
            headers: {'Range': 'bytes=' + file.length + "-", "User-Agent": userAgent}
        };
        var r = request(options)
            .on("data", function (chunk) {
                file.write(chunk);
                bytesDownloaded += chunk.toString().length;
            })
            .on("err", function (err) {
                if (verbage) {
                    console.log("Download Error, retrying in 5 seconds...");
                }
                setTimeout(function () {
                    resume();
                }, 5000)
            })
            .on('end', function () {
                // fin()
            });
    }

    function continueDownload(res) {
        if(verbage){console.log(fileUrl,"=>",filePath)};

        var file = fs.createWriteStream(filePath);

        if (options.progress) {
            var bar = new Progress.Bar({}, Progress.Presets.shades_classic);
            bar.start(stats.remoteFileSize, 0);
        }
        res.on('data', function (chunk) {
            file.write(chunk, 'binary', function () {
                stats.bytesDownloaded += chunk.length;
                if (bar) {
                    bar.update(stats.bytesDownloaded)
                }
            });
        }).on('end', function (endData) {
            if (bar) {
                bar.stop()
            }
            if (verbage) {
                console.log("Download complete.")
            }
            ;
            file.end();
            if (filePath.slice(-4).toLowerCase() == ".zip") {
                decomp(filePath, fin)
            }
            else {
                fin();
            }
        }).on('error', function (err) {
            throw err;
            file.end();
            if (bar) {
                bar.stop()
            }
            ;
        });
    }

    function start() {
        var r = request(rOptions)
            .on('response', function (res) {
                stats.remoteFileSize = parseInt(res.headers['content-length'], 10);
                if (overwrite) {
                    continueDownload(r)
                }
                else {
                    // check if there's a local file already
                    fs.exists(filePath, function (exists) {
                        if (exists) {
                            // see if its the right size
                            fs.stat(filePath, function (err, fileStats) {
                                if (fileStats.size == stats.remoteFileSize) {
                                    if (verbage) {
                                        console.log("Local file equal to remote file.", fileStats.size, "==", stats.remoteFileSize)
                                    }
                                    ;
                                    r.abort();
                                    fin();
                                }
                                else {
                                    if (verbage) {
                                        console.log("Local file not equal to remote file.", fileStats.size, "!=", stats.remoteFileSize)
                                    }
                                    ;
                                    continueDownload(r)
                                }
                            })
                        }
                        else {
                            continueDownload(r)
                        }
                    });
                }

            })
    }

    if (autoStart) {
        start()
    }
}

module.exports = Downloader;