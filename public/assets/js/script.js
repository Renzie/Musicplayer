/**
 * Created by Renzie on 16/02/2016.
 */
/*  TODO : - API IMPLEMENTATION
     - PUSH NOTIFICATIONS
     - MATTHIAS ZEN STUK VAN CCCP
     - MANIFEST
     - DEFTIGE CODE (NON-EXISTENT IN ONS WOORDENBOEK) AKA PROMISES, FETCH, SERVICE WORKERS, ...
     - REST VAN DE UI AFWERKEN
     - PROGRESS BAR VOOR MUZIEK
     - ....

 DONE : - MUZIEKSPELER (PLAY - PAUSE, NEXTSONG, SONG ON CLICK, )

 */

'use strict';

var getSongs = function (playlistid) {
    $.get("user/playlists/" + playlistid);
};

var getPlaylist = function () {
    return getUser(currentUser.id).then(function (data) {
        currentPlaylist = data.playlists;
    }, function (error) {
        console.log(error);
    })
};

var getPlaylists = function () {
    return getUser(currentUser.id).then(function (data) {
        playlistsUI.loadPlaylists(data.playlists);
    }, function (error) {
        console.log(error)
    })
};

var getUser = function (userid) {
    return $.get("users/" + userid);
};


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
var serviceWorker = null;
var APP_SERVER_KEY = "BMhLjpE_7Q48ufHZimrPOUEPRtzpN4Y9qL50WGP9WI4o67jgb22AyulGZEKrh3ljU_ePuYQY0BzCCNt2JC2G7yI";


var urlB64ToUint8Array = function (base64String) {
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
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service worker and push is supported');

        navigator.serviceWorker.register('assets/js/sw.js')
            .then(function (swReg) {
                console.log('Service worker is registered', swReg.scope);

                serviceWorker = swReg;
            })
            .catch(function (error) {
                console.error('Service worker error', error);
            })
    } else {
        console.warn('Push messaging is not supported');
    }
};


/* AUDIOPLAYER SETTINGS */ //DONE
var currentSong;
var currentPlaylist;
var currentUser;
var audio = new Audio();

// dit zorgt voor de autoplay
audio.addEventListener("ended", function () {
    if (audioPlayer.autoplay) {
        audioPlayer.nextSong();
    }
});

audio.addEventListener("timeupdate", function () {
    var duration = audio.duration;
    var currentTime = audio.currentTime;
    var width = (currentTime / duration) * 100;

    $(".progress").css("width" , width + "vw");

});

/* BACK-END AUDIO */
var audioPlayer = {
    autoplay: true,
    setAutoplay: function () {
        audioPlayer.autoplay = !audioPlayer.autoplay;
        console.log("autoplay set: " + audioPlayer.autoplay);
    },
    setSong: function (id) {
        currentSong = currentPlaylist.songs[id - 1];//id van de song
        console.log(currentSong);
        audio.src = '../songlist/' + currentSong.mp3;
    },
    playSong: function () { // speel de current song af, indien er nog geen song afgespeeld is speel je de eerste song
        audio.play();
        audioplayerUI.resumeOrPause();
        audioplayerUI.updateSongTitle();
    },
    playFirstSong: function () {
        audioPlayer.setSong(1);
        audioPlayer.playSong();
    },
    pauseSong: function () {
        audio.pause();
        audioplayerUI.resumeOrPause();
    },
    resumeSong: function () {
        if (audio.src == "") {
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
        console.log("next song")
    },
    previousSong: function () {
        if (currentSong == undefined) {
            audioPlayer.playFirstSong();
        } else {
            audioPlayer.setSong(currentSong.id - 1);
            audioPlayer.playSong()
        }
    },
    selectSong: function (e) {
        e.preventDefault();
        var songId = $(this).attr("data-id");
        audioPlayer.setSong(songId);
        audioPlayer.playSong();
    },
    setPlaylist: function () {
        console.log("derp")
        var playlistid = $(this).parent().attr('data-id');
        return getUser(currentUser.id).then(function (data) {
            currentPlaylist = data.playlists[playlistid - 1];
        }).then(function () {
            mainUI.goToSongs();
        }, function (error) {
            console.log(error)
        });
    }
};

function getID(user, password) {

    var users = $.get("/user");
    var pw = require('node_modules/password-hash/lib');
    var hashed = pw.generate(password);
    for (var i = 0; i < users.length; i++) {
        if (users.nickname === user && users.password === hashed) {
            return users.id;
        }
    }
}

function addSongToPlaylist(userId, playlistId, songId) {
    var song = {"id": songId};

    $.ajax({
        url: "/user/" + userId + "/playlists/" + playlistId + "/songs",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(song),
        dataType: "json"
    })
}
function getSongsUser(userId) {
    var users = $.get("/user");
    var songs = [];
    for (var i = 0; i < users.length; i++) {
        if (users.id === userId) {
            for (var j = 0; j < users[i].songs; j++) {
                songs.push(users[i].songs[j]);
            }
        }
    }
    return songs;
}

function getRecordsUser(userId) {
    var users = $.get("/user");
    var records = [];
    for (var i = 0; i < users.length; i++) {
        if (users.id === userId) {
            for (var j = 0; j < users[i].records; j++) {
                records.push(users[i].records[j]);
            }
        }
    }
    return records;
}
function addPlaylist(userId, name) {
    var playlist = {"id": userFunctions.checkIdPlaylist(userId), "name": name, "songs": {}};
    $.ajax({
        url: "/user/" + userId + "/playlists",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(playlist),
        dataType: "json"
    })
}
function getPlaylistsUser(userId) {
    var users = $.get("/user");
    var playlists = [];
    for (var i = 0; i < users.length; i++) {
        if (users.id === userId) {
            for (var j = 0; j < users[i].playlists; j++) {
                playlists.push(users[i].playlists[j]);
            }
        }
    }
    return playlists;
}

function zuiverData(text){
    var string = text.replace('\"','').replace('\'','').replace('\,','').replace('\\','');
    return string;
}
//setUser as default for testing and stuff
var userFunctions = {
    setUser: function () {
        if (currentUser == null) {
            return getUser(1).then(function (data) {
                currentUser = data;
            }, function (error) {
                console.log(error)
            })
        }
    },
    //check id for new user
    checkIdUser: function () {
        var users = $.get("/user");
        var id = 1;
        for (var i = 0; i < users.length; i++) {
            if (id != users.id) {
                return i + 1;
            }
        }
    },
    //max 4 verkeerde logins
    checkLoginAttempts: function (userId) {
        var loginAttempt = $.get("/user/" + userId);
        if (loginAttempt.login <= 3) {
            return true;
        }
    },

    incrLoginAttempts: function (userId) {
        var incrLoginAttempt = $.get("/user/" + userId);
        incrLoginAttempt.login++;
    },

    resetLoginAttempts: function (userId) {
        var reset = 0;
        $.ajax({
            url: "/user/" + userId + "/login",
            type: "PATCH",
            contentType: "application/json",
            data: JSON.stringify(reset),
            dataType: "json"
        })
    },

    checkIdPlaylist: function (id) {
        var playlist = $.get("/users/" + id);
        var playlistId = 1;
        for (var i = 0; i < playlist.length; i++) {
            if (playlistId != playlist.id) {
                return i + 1;
            }
        }
    },

    loginUser : function() {
        var users = $.get("/users");
        var username = zuiverData(("#username").text());
        var password = zuiverData(("#password").text());
        users.then(function (data) {
            for (var i= 0; i < data.length; i++ ){
                if (username === data[i].username){
                    if (password === data[i].password){
                        return data[i];
                    }
                }

                }
            return false;
        })



    },
    addUser : function () {
        var User = {
            "id": userFunctions.checkIdUser(),
            "name": "",
            "email": "",
            "nickname": "",
            "password": "",
            "login": "",
            "songs": {
                /*
                 "id" : "",
                 "title": "",
                 "author": "",
                 "mp3":"",
                 "cover":""*/
            },
            "records": {
                /*"id" : "",
                 "title": "",
                 "mp3":""*/
            },
            "playlists": {
                /*"id": "",
                 "name": "",
                 "songs" :
                 {
                 "id" : ""
                 }*/
            }
        }
        $.ajax({
            url: "/user",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(User),
            dataType: "json"
        })
    }


};
/* FRONT END AUDIO */ //DONE
var audioplayerUI = {

    bindEvents: function () {
        $("[data-role='listview'] ").off().on('click', '.song', audioPlayer.selectSong);
        $(".autoplay").off().on('click', audioPlayer.setAutoplay);
    },

    resumeOrPause: function () {
        var flip = true,
            play = "M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28",
            pause = "M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26",
            $animation = $('.animation');
        flip = !flip;
        if (audio.paused) {
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

    //resumeOrPause: function () {
        // var byteKey = urlB64ToUint8Array(APP_SERVER_KEY)

     //   audioplayerUI.animateResumeOrPause();
        /*serviceWorker.pushManager.subscribe({
         userVisibleOnly: true,
         applicationServerKey: byteKey
         }).then(function (sub) {
         //subscribeOnServer(sub);
         //isSubscribed = true;

         });*/
    //},

    updateSongTitle: function () {
        $("header h1").text(currentSong.title + " - " + currentSong.author);
    },

    fillPlaylistUI: function () {
        var playlistUI = $(".currentPlaylist");
        playlistUI.children().remove();
        for (var i = 0; i < currentPlaylist.songs.length; i++) {
            var html = "<li data-id='" + currentPlaylist.songs[i].id + "' class='song ui-li-has-alt ui-li-has-thumb ui-first-child ui-last-child'><a class='playsong ui-btn' href='#'>" +
                "<img src='../../images/covers/defaultcover.jpg' > " +
                "<h2>" + currentPlaylist.songs[i].title + "</h2>" +
                "<p>" + currentPlaylist.songs[i].author + "</p>" +
                "</a> <a class='ui-btn ui-btn-icon-notext ui-icon-gear' href='' data-rel='popup' data-position-to='window' data-transition='pop'></a></li>"
            playlistUI.append(html);
        }
    }
};


var mainUI = {
    bindEvents: function () { //off() om alles te rebinden, sinds dit bij elke page load anders stackt, waardoor de functions meerdere keren wordt opgeroepen
        $(".ytp-button").off().on('click', audioPlayer.resumeSong);
        $(".step-forward").off().on('click', audioPlayer.nextSong);
        $(".step-backward").off().on('click', audioPlayer.previousSong);
        $(".home").off().on("click", mainUI.goToHomePage);
        $(".playlists").off().on('click', mainUI.goToPlayListsPage);
        $(".progressbar").off().on('click', mainUI.changeCurrentTime);

    },

    loadContent : function (dataname) {
        $("[data-role='main']").hide();

        $("[data-name='" + dataname + "']").css("display", "inline");

    },

    goToPage: function (page) {
        $.mobile.pageContainer.pagecontainer("change", page, {
            transition: "fade",
            reverse: true,
            changeHash: true,
            showLoadMsg: true
        });
    },
    goToHomePage: function () {
        mainUI.loadContent("home")

    },
    goToPlayListsPage: function () {

        pageChange(playlistsUI);
        mainUI.loadContent("playlists");
        //mainUI.goToPage("ListOfPlaylists.html");
        //doFunctionOnPageLoad(getPlaylists);
        getPlaylists();
        playlistsUI.bindEvents();
    },
    goToSongs: function () {
        //pageChange(audioplayerUI);
        mainUI.loadContent("songs");
        audioplayerUI.fillPlaylistUI();
        console.log(currentPlaylist);
        audioplayerUI.bindEvents();

    },

    changeCurrentTime : function (e) {

        var x = e.pageX - this.offsetLeft,
            progressbar = $(".progress"),
            totalWidth = window.innerWidth,
            clickedValue = x / totalWidth;

            progressbar.css("width", clickedValue * audio.duration   + "vw");
            audio.currentTime = clickedValue * audio.duration

    }
};

var playlistsUI = {
    bindEvents: function () {
        $("[data-role='listview']").off().on("click", '.selectplaylist', audioPlayer.setPlaylist)
    },
    loadPlaylists: function (data) {
        var playlists = $("[data-name=content]");
        playlists.children().remove();
        for (var i = 0; i < data.length; i++) {
            var html = "<li data-id='" + data[i].id + "' class='ui-li-has-alt ui-li-has-thumb ui-first-child ui-last-child'><a class='selectplaylist ui-btn' href='#'>" +
                "<img src='../../images/covers/defaultcover.jpg' > " +
                "<h2>" + data[i].name + "</h2>" +
                "<p>" + data[i].songs.length + " songs </p>" +
                "</a> <a class='ui-btn ui-btn-icon-notext ui-icon-gear' href='' data-rel='popup' data-position-to='window' data-transition='pop'></a></li>";
            playlists.append(html);
        }
    }
};

var pageChange = function (UI) {
    $(document).on("pagechange", function () {
        UI.bindEvents();
    });
};

var pageLoad = function (doThatFunction) {
    $(function () {
        registerServiceWorker();
        userFunctions.setUser();
    })
};

var doFunctionOnPageLoad = function (thatFunction) {
    thatFunction();
};


$(function () {
    mainUI.bindEvents();
})
pageLoad();
//pageChange(mainUI);




