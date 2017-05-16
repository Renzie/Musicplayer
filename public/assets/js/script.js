/**
 * Created by Renzie on 16/02/2016.
 */
/*  TODO : - API IMPLEMENTATION
 - PUSH NOTIFICATIONS
 - LOGIN
 - MANIFEST
 - REST VAN DE UI AFWERKEN
 - ....

 DONE : - MUZIEKSPELER (PLAY - PAUSE, NEXTSONG, SONG ON CLICK, )
 - PROGRESS BAR VOOR MUZIEK
 */

'use strict';
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
        if (serviceWorker == null) {

            navigator.serviceWorker
                .register('/sw.js')
                .then(function (swReg) {
                    console.log(swReg)
                })
                .catch(function (error) {
                    console.error('Service worker error', error);
                })
        }
    }
    else {
        console.warn('Push messaging is not supported');
    }
};


/* AUDIOPLAYER SETTINGS */ //DONE
var currentSong;
var currentPlaylist;
var currentUser;
var audio = new Audio();

var setAudioEventListeners = function () {
    audio.addEventListener("ended", function () {
        if (audioPlayer.autoplay) {
            audioPlayer.nextSong();
        }
    });

    audio.addEventListener("loadedmetadata", audioplayerUI.setDuration);

    audio.addEventListener("timeupdate", function () {
        var duration = audio.duration,
            currentTime = audio.currentTime,
            minutes = Math.floor(currentTime / 60),
            seconds = Math.floor(currentTime) % 60,
            width = (currentTime / duration) * 100;


        minutes = minutes >= 10 ? minutes : '0' + minutes;
        seconds = seconds >= 10 ? seconds : '0' + seconds;
        $(".curtime .minutes").text(minutes);
        $(".curtime .seconds").text(seconds);

        $(".progress").css("width", width + "vw");

    });
}
// dit zorgt voor de autoplay


/* BACK-END AUDIO */
var audioPlayer = {
    autoplay: false,
    setAutoplay: function () {
        audioPlayer.autoplay = !!$(this).is(':checked');
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
        var songId = $(this).parent().attr("data-id");
        audioPlayer.setSong(songId);
        audioPlayer.playSong();
    },
    setPlaylist: function () {
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

function sanatize(text) {
    var string = text.replace('\"', '').replace('\'', '').replace('\,', '').replace('\\', '');
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

    loginUser: function () {
        var users = $.get("/users");
        var username = sanatize(("#username").text());
        var password = sanatize(("#password").text());

        users.then(function (data) {
            for (var i = 0; i < data.length; i++) {
                if (username === data[i].nickname) {
                    if (userFunctions.checkLoginAttempts(data[i].id)) {
                        if (passwordHash.verify(password, data[i].password)) {
                            userFunctions.resetLoginAttempts(data[i].id);
                            return data[i];
                        } else {
                            userFunctions.incrLoginAttempts(data[i].id);
                            return false;
                        }
                    }
                }
            }
            return false;
        })
    },
    addUser: function () {
        var password = sanatize($("#passwordRegister"));
        var passwordHash = require('./lib/password-hash');
        var hashedPassword = passwordHash.generate(password);
        var User = {
            "id": userFunctions.checkIdUser(),
            "name": sanatize($("#name")),
            "email": sanatize($("#email")),
            "nickname": sanatize($("#usernameRegister")),
            "password": hashedPassword,
            "login": 0,
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
        };
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
    setDuration: function () {
        var duration = Math.floor(audio.duration),
            minutes = Math.floor(duration / 60),
            seconds = Math.floor(duration) % 60;
        $(".duration .minutes").text(minutes);
        $(".duration .seconds").text(seconds);
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

    updateSongTitle: function () {
        $("header h1").text(currentSong.title + " - " + currentSong.author);
    },

    fillPlaylistUI: function () {
        var playlistUI = $(".currentPlaylist");
        playlistUI.children().remove();
        for (var i = 0; i < currentPlaylist.songs.length; i++) {
            var html = "<li data-id='" + currentPlaylist.songs[i].id + "' class='song ui-li-has-alt ui-li-has-thumb ui-first-child ui-last-child'><a class='playsong ui-btn' href='#'>" +
                "<img src='../../images/covers/defaultcover.jpg' />" +
                "<h2>" + currentPlaylist.songs[i].title + "</h2>" +
                "<p>" + currentPlaylist.songs[i].author + "</p>" +
                "</a> <a class='optionssong ui-btn ui-btn-icon-notext ui-icon-gear' href='#popupoptions' data-position-to='origin' data-rel='popup' data-transition='slideup'></a></li>";
            playlistUI.append(html);
        }
    },


};


var mainUI = {
    bindEvents: function () { //off() om alles te rebinden, sinds dit bij elke page load anders stackt, waardoor de functions meerdere keren wordt opgeroepen
        $(".ytp-button").off().on('click', audioPlayer.resumeSong);
        $(".step-forward").off().on('click', audioPlayer.nextSong);
        $(".step-backward").off().on('click', audioPlayer.previousSong);
        $(".home").off().on("click", mainUI.goToHomePage);
        $(".playlists").off().on('click', mainUI.goToPlayListsPage);
        $(".progressbar").off().on('click', mainUI.changeCurrentTime);
        $(".settings").off().on('click', mainUI.goToSettings);
        $(".register").off().on('click', mainUI.goToRegister);
        $("#autoplay").change(audioPlayer.setAutoplay);
        $("[data-name='songs'] [data-role='listview'] ").off().on('click', '.playsong', audioPlayer.selectSong);
        $(".autoplay").off().on('click', audioPlayer.setAutoplay);
        $("[data-name='playlists'] [data-role='listview']").off().on("click", '.selectplaylist', audioPlayer.setPlaylist);
    },

    loadContent: function (dataname) {
        $("[data-role='main']").hide();
        $("[data-name='" + dataname + "']").css("display", "inline");
    },

    goToHomePage: function () {
        mainUI.loadContent("home")
        mainUI.showMessage("to home");
    },

    goToPlayListsPage: function () {
        mainUI.loadContent("playlists");
        getPlaylists();
    },

    goToSongs: function () {
        mainUI.loadContent("songs");
        audioplayerUI.fillPlaylistUI();
    },

    goToSettings: function () {
        mainUI.loadContent("settings");
    },

    goToRegister: function (e) {
        e.preventDefault();
        mainUI.loadContent("register");
    },

    changeCurrentTime: function (e) {
        var x = e.pageX - this.offsetLeft,
            progressbar = $(".progress"),
            totalWidth = window.innerWidth,
            clickedValue = x / totalWidth;

        progressbar.css("width", clickedValue * audio.duration + "vw");
        audio.currentTime = clickedValue * audio.duration
    },
    showMessage : function (text) {
        $("[data-role='popup'] .message").html(text);
        $("[data-role='popup']").popup("open");
        setTimeout(function () {
            $("[data-role='popup']").popup("close");
        }, 1000)
    },
    /*showSongOptions : function () {
        $("[data-role='popup'] .message").html("derp");
        $("[data-role='popup']").popup("open");
        }*/
};

var playlistsUI = {
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

$(function () {
    userFunctions.setUser();
    mainUI.bindEvents();
    setAudioEventListeners();
    registerServiceWorker();
});