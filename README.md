# file-downloader
Download files with node.js

## Setup
    npm install Jakeflow27/file-downloader

## Usage
    var Downloader = require("./downloader");
    
    var url = "http://www.scrabbleplayers.org/words/10-15-20030401.txt";
    var options = {"cli-progress":true};
    
    new Downloader(url,options,function(stats){
        console.log("Downloaded", stats.url ,"to", stats.filePath, "in", stats.time, "seconds.\n");
        console.log(stats);
    })
    
    Output:
    
    Downloaded http://www.dla.mil/Portals/104/Documents/InformationOperations/LogisticsInformationServices/FOIA/FCAN-SEGK.zip?ver=2018-08-02-144216-620 to C:\Users\admin\WebstormProjects\file-downloader\file-downloader\FCAN-SEGK.zip in 11.172 seconds.
    
    { time: 11.172,
      filePath: 'C:\\Users\\admin\\WebstormProjects\\file-downloader\\file-downloader\\FCAN-SEGK.zip',
      url: 'http://www.dla.mil/Portals/104/Documents/InformationOperations/LogisticsInformationServices/FOIA/FCAN-SEGK.zip?ver=2018-08-02-144216-620',
      bytesDownloaded: 5853028,
      remoteFileSize: 5853028 }

### Options
    All options are optional.
    
    cli-download : Boolean, show a download progress, Default: false
    start :        Boolean, false to start later with Downloader.start(), Default: true
    filePath :     String,  path for the file to be downloaded to includeing file name, Default: (parse url)
    resume :       Boolean, try to resume the download on failure, Default: true
    retries:       Int,     number of retries Default: infinite
    userAgent:     String,  custom userAgent, Default: chrome,ie,safari+node ua
    overwrite:     Boolean, force the download even if an equal sized file with the same name exists, Default:false
    