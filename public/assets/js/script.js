/**
 * Created by Renzie on 16/02/2016.
 */
/*  TODO : - API IMPLEMENTATION
           - PUSH NOTIFICATIONS
           - MATTHIAS ZEN STUK VAN CCCP
           - MANIFEST
           - DEFTIGE CODE (NON-EXISTENT IN ONS WOORDENBOEK) AKA PROMISES, FETCH, SERVICE WORKERS, ...
           - REST VAN DE UI AFWERKEN
           - ....

    DONE : - MUZIEKSPELER (PLAY - PAUSE, NEXTSONG, SONG ON CLICK, )

 */

'use strict';

/* API GETTERS */
//var pm = require('playmusic');

/*window.onload = function () {
    var player = new Audio('https://www.youtube.com/watch?v=Qe500eIK1oA&list=RDMMQe500eIK1oA')
    player.preload = 'metadata'
    player.play()
    player.controls = true
    document.body.appendChild(player)
}*/

var getSongs =  function (playlistid) {
   Promise.resolve($.get("playlists/" + playlistid));
};
var playlistURL = $.get("playlists");
var promisePlaylist = Promise.resolve(playlistURL);

/*function loadSoundCloud(url) {
    return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.responseType = 'blob';

        request.onload = function () {
            if (request.status === 200){
                resolve(request.response);
            } else {
                reject(Error('Unable to load SoundCloud; error code: ' + request.statusText))
            }
        }

        request.onerror = function () {
            reject(Error('There was a network error.'))
        }

        request.send();
    })
}*/


/* PUSH NOTIFICATION */  //TODO
var notification;
var serviceWorker = null;
var APP_SERVER_KEY = "BMhLjpE_7Q48ufHZimrPOUEPRtzpN4Y9qL50WGP9WI4o67jgb22AyulGZEKrh3ljU_ePuYQY0BzCCNt2JC2G7yI";



var urlB64ToUint8Array = function(base64String) {
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

/*var registerServiceWorker = function () { //voor pushnotification
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
};*/




/* AUDIOPLAYER SETTINGS */ //DONE
var currentSong;
var currentPlaylist;
var audio = new Audio();
audio.addEventListener("ended",function () {
    if (audioPlayer.autoplay){
        audioPlayer.nextSong();
    }
}); // dit zorgt voor de autoplay

var Song = function (id, title, author, mp3) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.mp3 = mp3;
};

var Playlist = function (id, name) {
    this.id = id;
    this.name = name;
    this.songs = [];
};


/* BACK-END AUDIO */
var audioPlayer = {
    autoplay: true,
    self: this,
    playlist: {
        songs: [],
        offline: false
    },
    loadSongs: function (playlistid) {
        getSongs(playlistid).then(function (data) {
            for (var i = 0; i < data.songs.length; i++) {
                audioPlayer.playlist.songs.push(new Song(data.songs[i].id, data.songs[i].title, data.songs[i].author, data.songs[i].mp3));
            }
           audioplayerUI.fillPlaylistUI(audioPlayer.playlist.songs);
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
        audioplayerUI.resumeOrPause();
        audioplayerUI.updateSongTitle();

        if (!("Notification" in window)) {
            $("header section h1").removeClass('hide')
        }
        Notification.requestPermission(function () {
            notification = new Notification(currentSong.title, {
                body: currentSong.author,
                icon: "../../images/covers/defaultcover.jpg"
            })
        });
        Notification.buildFragment()
    },
    playFirstSong : function () {
        audioPlayer.setSong(1) ;
        audioPlayer.playSong();
    },
    pauseSong : function () {
        audio.pause();
        audioplayerUI.resumeOrPause();
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
    },
    setPlaylist : function (selectedPlaylist) {
        currentPlaylist = selectedPlaylist;
        audioPlayer.loadSongs(currentPlaylist.id);
    }
};


/* FRONT END AUDIO */ //DONE
var audioplayerUI = {

    bindEvents: function () {
        $("[data-role='listview'] ").on('click','.song',audioPlayer.selectSong);
        $(".autoplay").on('click',audioPlayer.setAutoplay);
    },

    animateResumeOrPause: function () {
        var flip = true,
            play = "M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28",
            pause = "M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26",
            $animation = $('.animation');
        flip = !flip;
        if (audio.paused){
            $animation.attr({
                "from": /*flip ? pause : play,*/ pause,
                "to": /*flip ? play : pause*/ play
            }).get(0).beginElement();
        } else {
            $animation.attr({
                "from": /*flip ? pause : play,*/ play,
                "to": /*flip ? play : pause*/ pause
            }).get(0).beginElement();
        }
    },

    resumeOrPause: function () {
       // var byteKey = urlB64ToUint8Array(APP_SERVER_KEY)

        audioplayerUI.animateResumeOrPause();
        /*serviceWorker.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: byteKey
        }).then(function (sub) {
            //subscribeOnServer(sub);
            //isSubscribed = true;

        });*/
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

var playlists = {
    loadPlaylists : function () {

        promisePlaylist.then(function (response) {
            playlistsUI.loadPlaylists(response);
        }, function (error) {
            console.log("ERROR: " + error);
        })
    }
};

var mainUI = {
    bindEvents : function () {
        $(".ytp-button").on('click', audioPlayer.resumeSong);
        $(".step-forward").on('click', audioPlayer.nextSong);
        $(".step-backward").on('click', audioPlayer.previousSong);
        $(".home").on("click", mainUI.goToHomePage);
        $(".playlists").on('click',mainUI.goToPlayListsPage);
    },
    goToPage : function (page) {
        $.mobile.pageContainer.pagecontainer("change", page, {
            transition : "flip",
            reverse : true,
            changeHash: true,
            showLoadMsg : true
        });
    },

    goToHomePage :  function () {
        mainUI.goToPage("Index.html");

    },
    goToPlayListsPage : function () {
        mainUI.goToPage("ListOfPlaylists.html");
        playlists.loadPlaylists();
    },
    goToSongs : function (playlistid) {
        console.log("derp")
        mainUI.goToPage("Playlist.html");
        audioPlayer.loadSongs(playlistid)
    }
};

var playlistsUI = {
    bindEvents : function () {
        $("[data-role='listview']").on("click",'.selectplaylist',mainUI.goToSongs)
    },
    loadPlaylists : function (data) {
        var playlists = $("[data-name=content]");
        for (var i = 0; i< data.length; i++){
            var html = "<li data-id='" + data[i].id + "' class='ui-li-has-alt ui-li-has-thumb ui-first-child ui-last-child'><a class='selectplaylist ui-btn' href='#'>" +
                "<img src='../../images/covers/defaultcover.jpg' > " +
                "<h2>" + data[i].name + "</h2>" +
                "<p>" + data[i].songs.length + " songs </p>" +
                "</a> <a class='ui-btn ui-btn-icon-notext ui-icon-gear' href='' data-rel='popup' data-position-to='window' data-transition='pop'></a></li>";
            playlists.append(html);
        }
    }
};



$(document).on("pagechange",function () {
    mainUI.bindEvents();
    audioplayerUI.bindEvents();

    //registerServiceWorker();

});

