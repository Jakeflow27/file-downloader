var Downloader = require("./downloader");

var url = "http://www.scrabbleplayers.org/words/10-15-20030401.txt";
var options = {"cli-progress": true};

new Downloader(url, options, function (stats) {
    console.log("Downloaded", stats.url, "to", stats.filePath, "in", stats.time, "seconds.");
    console.log(stats);
});
