/**
 * Created by Renzie on 9/05/2017.
 */


const express = require("express")

var path = require('path')
const app = express();


const stream = require('youtube-audio-stream');
const url = 'http://youtube.com/watch?v=34aQNMvGEZQ';
const decoder = require('lame').Decoder;
const speaker = require('speaker');

stream(url)
    .pipe(decoder())
    .pipe(speaker());

var ytdl = require('ytdl-core')
var FFmpeg = require('fluent-ffmpeg')
var through = require('through2')
var xtend = require('xtend')

function demo(req, res) {
    if (req.url === '/') {
        return fs.createReadStream(path.join(__dirname, '/server.html')).pipe(res)
    }
    if (/youtube/.test(req.url)) {
        stream(req.url.slice(1)).pipe(res)
    }
}
http.createServer(app).listen(25565)

