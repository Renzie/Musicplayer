/**
 * Created by Renzie on 16/02/2016.
 */
'use strict';
var getSongs = $.get("/songs");


var getSCSongs = $.get('https://api.soundcloud.com/connect');
console.log(getSCSongs)

var notification;




var serviceWorker = null;
var APP_SERVER_KEY = "BMhLjpE_7Q48ufHZimrPOUEPRtzpN4Y9qL50WGP9WI4o67jgb22AyulGZEKrh3ljU_ePuYQY0BzCCNt2JC2G7yI";


//currentsong is een Song object die de song bijhoudt dat afgespeeld wordt.
var currentSong;
var audio = new Audio();
audio.addEventListener("ended",function () {
    if (audioPlayer.autoplay){
        audioPlayer.nextSong();
    }

})

var urlB64ToUint8Array = function(base64String) // voor pushnotification
{
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
};

var registerServiceWorker = function () { //voor pushnotification
    if ('serviceWorker' in navigator && 'PushManager' in window){
        console.log('Service worker and push is supported');

        navigator.serviceWorker.register('assets/js/sw.js')
            .then(function (swReg) {
                console.log('Service worker is registered', swReg);

                serviceWorker = swReg;
            })
            .catch(function (error) {
                console.error('Service worker error', error);
            })
    } else {
        console.warn('Push messaging is not supported');
    }
};


var audioPlayer = {
    autoplay: true,
    self: this,
    playlist: {
        songs: [],
        offline: false
    },

    loadSongs: function () {
        getSongs.then(function (data) {
            for (var i = 0; i < data.length; i++) {
                audioPlayer.playlist.songs.push(new Song(data[i].id, data[i].title, data[i].author, data[i].mp3));
            }
            playlistUI.fillPlaylistUI(audioPlayer.playlist.songs);
        }, function (xhrObj) {
            console.log(xhrObj);
        });
        $(".playsong").on("click",audioPlayer.selectSong)
    },

    setAutoplay : function () {
        audioPlayer.autoplay = !audioPlayer.autoplay;
        console.log(audioPlayer.autoplay);
    },
    setSong: function (id) {
        currentSong = audioPlayer.playlist.songs[id - 1];//id van de song
        console.log(currentSong);
        audio.src = '../songlist/' + currentSong.mp3;
    },
    playSong: function () { // speel de current song af, indien er nog geen song afgespeelt is speel je de eerste song
        audio.play();
        playlistUI.resumeOrPause();
        playlistUI.updateSongTitle();

        if (!("Notification" in window)) {
            $("header section h1").removeClass('hide')
        }
        Notification.requestPermission(function () {
            notification = new Notification(currentSong.title, {
                body: currentSong.author,
                icon: "../../images/covers/defaultcover.jpg"
            })
        })

Notification.buildFragment()

    },
    playFirstSong : function () {
        audioPlayer.setSong(1) ;
        audioPlayer.playSong();
    },
    pauseSong : function () {
        audio.pause();
        playlistUI.resumeOrPause();
    },
    resumeSong: function () {
        if (audio.src == ""){
            audioPlayer.setSong(1);
            audioPlayer.playSong();
        } else if (audio.paused) {
            audioPlayer.playSong();
        } else {
            audioPlayer.pauseSong();
        }
        console.log("paused");
    },
    nextSong: function () {
        if (currentSong == undefined) {
            audioPlayer.playFirstSong();
        } else {
            audioPlayer.setSong(currentSong.id + 1);
            audioPlayer.playSong()
        }
    },
    previousSong : function () {
        if (currentSong == undefined) {
            audioPlayer.playFirstSong();
        } else {
            audioPlayer.setSong(currentSong.id - 1);
            audioPlayer.playSong()
        }
    },
    selectSong : function (e) {
        e.preventDefault();
        var songId = $(this).attr("data-id");
        audioPlayer.setSong(songId);
        audioPlayer.playSong();
    }
};


var Song = function (id, title, author, mp3) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.mp3 = mp3;
};

var playlistUI = {

    bindEvents: function () {
        $(".ytp-button").on('click', audioPlayer.resumeSong);
        $(".step-forward").on('click', audioPlayer.nextSong);
        $(".step-backward").on('click', audioPlayer.previousSong);
        $(".home").on("click", playlistUI.gotoHomePage);
        $("[data-role='listview'] ").on('click','.song',audioPlayer.selectSong);
        $(".autoplay").on('click',audioPlayer.setAutoplay);
    },
    gotoHomePage :  function () {
        //$.mobile.pageContainer = $("[data-role='main']").pagecontainer();
        $.mobile.pageContainer.pagecontainer("change", "Home.html", {
            transition : "flip",
            reverse : true,
            changeHash: true,
            showLoadMsg : true
        });
    },

    animateResumeOrPause: function () {
        var flip = true,
            play = "M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28",
            pause = "M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26",
            $animation = $('.animation');
        flip = !flip;
        $animation.attr({
            "from": flip ? pause : play,
            "to": flip ? play : pause
        }).get(0).beginElement();
    },

    resumeOrPause: function () {
        var byteKey = urlB64ToUint8Array(APP_SERVER_KEY)

        playlistUI.animateResumeOrPause();
        serviceWorker.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: byteKey
        }).then(function (sub) {
            //subscribeOnServer(sub);
            //isSubscribed = true;

        });
    },

    updateSongTitle: function () {
        $("header h1").text(currentSong.title + " - " + currentSong.author);
    },

    fillPlaylistUI: function (data) {
        var playlistUI = $(".currentPlaylist");
        for (var i = 0; i < data.length; i++) {
            var html = "<li data-id='" + data[i].id + "' class='song ui-li-has-alt ui-li-has-thumb ui-first-child ui-last-child'><a class='playsong ui-btn' href='#'>" +
                "<img src='../../images/covers/defaultcover.jpg' > " +
                "<h2>" + data[i].title + "</h2>" +
                "<p>" + data[i].author + "</p>" +
                "</a> <a class='ui-btn ui-btn-icon-notext ui-icon-gear' href='' data-rel='popup' data-position-to='window' data-transition='pop'></a></li>"
            playlistUI.append(html);
        }
    }
};

$(document).on("pagechange",function () {
    console.log("initialized");
    audioPlayer.loadSongs();
    playlistUI.bindEvents();

    registerServiceWorker();

});

