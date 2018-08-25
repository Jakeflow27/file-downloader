# file-downloader
Download files with node.js

## Setup
    npm install Jakeflow27/file-downloader

## Usage
    var Downloader = require("file-downloader");
    
    var url = "http://www.scrabbleplayers.org/words/10-15-20030401.txt";
    var options = {"cli-progress":true};
    
    new Downloader(url,options,function(stats){
        console.log("Downloaded", stats.url ,"to", stats.filePath, "in", stats.time, "seconds.\n\n");
        console.log(stats);
    })
    
    Output:
    
    Downloaded http://www.scrabbleplayers.org/words/10-15-20030401.txt to C:\Users\admin\WebstormProjects\file-downloader\file-downloader\10-15-20030401.txt in 1.673 seconds.
    
    { time: 1.673,
      filePath: 'C:\\Users\\admin\\WebstormProjects\\file-downloader\\file-downloader\\10-15-20030401.txt',
      url: 'http://www.scrabbleplayers.org/words/10-15-20030401.txt',
      bytesDownloaded: 611800,
      remoteFileSize: 616898 }

### Options
    All options are optional.
    
    progress:      Boolean, show a cli download progress bar, Default: false
    start :        Boolean, false to start later with Downloader.start(), Default: true
    filePath :     String,  path for the file to be downloaded to includeing file name, Default: (parse url)
    resume :       Boolean, try to resume the download on failure, Default: true
    retries:       Int,     number of retries Default: infinite
    userAgent:     String,  custom userAgent, Default: chrome,ie,safari+node ua
    overwrite:     Boolean, force the download even if an equal sized file with the same name exists, Default:false
    autoUnzip:     Boolean, if the file is a zip, extract the contents? Default: true
    verbage:       Boolean, log to console actions, Default: false
    