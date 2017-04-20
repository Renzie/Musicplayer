/**
 * Created by Renzie on 16/02/2016.
 */
var getSongs = $.get("/songs"); //promise


//currentsong is een Song object die de song bijhoudt dat afgespeeld wordt.
var currentSong;
var audio = new Audio();

var audioPlayer = {
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
        })
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
        console.log("derp")
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
    },
    gotoHomePage :  function () {
        //$.mobile.pageContainer = $("[data-role='main']").pagecontainer();
        $.mobile.pageContainer.pagecontainer("change", "Home.html", {
            transition : "flip",
            reverse : true,
            changeHash: true,
            showLoadMsg : true
        });
        /*$.mobile.pageContainer.pagecontainer({
                remove : function (event, ui) {
                    console.log(ui.prevPage)
                }
            }
        );*/

        /*$.mobile.changePage("Home.html",{
            transition : "pop",
            reverse : false,

            changeHash: false,
        })*/


        //playlistUI.bindEvents();

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
        playlistUI.animateResumeOrPause();
    },

    updateSongTitle: function () {
        $("header h1").text(currentSong.title + " - " + currentSong.author);
    },

    fillPlaylistUI: function (data) {
        for (var i = 0; i < data.length; i++) {
            var playlistUI = $("#currentPlaylist");
            var html = "<li class='ui-li-has-alt ui-li-has-thumb ui-first-child ui-last-child'><a class='ui-btn' href='#'>" +
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
});

