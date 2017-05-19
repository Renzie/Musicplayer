/**
 * Created by Renzie on 16/02/2016.
 */
/*  TODO :
 - PUSH NOTIFICATIONS
 - LOGIN
 - REST VAN DE UI AFWERKEN
 - NIEUWE PLAYLISTS AANMAKEN
 - ....

 DONE : - MUZIEKSPELER (PLAY - PAUSE, NEXTSONG, SONG ON CLICK, )
 - PROGRESS BAR VOOR MUZIEK
 - MANIFEST

 */

'use strict';
var CRUD = {
    GET: function (url) {
        return $.get(url);
    },

// foreign keys komen in stringvorm uit als ik het in de korte manier codeer
    POST: function (url, object) {
        return $.ajax({
            url: "/" + url,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(object),
            dataType: "json"
        })
    },
    PATCH : function (url, object) {
        console.log(JSON.stringify(object))
        $.ajax({
            url: url,
            type: 'PATCH',
            data: JSON.stringify(object),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                console.log(data)
            },
            error : function (xhr, ajaxOptions, thrownError) {
                if(xhr.status==404) {
                    alert(thrownError);
                }
            }

        })
    }
}

var getPlaylist = function (name) {
    return CRUD.GET('/playlists?name=' + name);
}

var getPlaylists = function () {
    return getUser(currentUser.id).then(function (data) {
        playlistsUI.loadPlaylists(data.playlists);
    }, function (error) {
        console.log(error)
    })
};

var getSongs = function () {
    return CRUD.GET("/songs").then(function (data) {
        currentPlaylist.songs = data;
        console.log(currentPlaylist);
        mainUI.goToSongs();
        audioplayerUI.fillPlaylistUI();
    }, function (error) {
        console.log(error);
    });
};

var getUser = function (userid) {
    return $.get("users/" + userid);
};

function Playlist(name) {
    this.name = name;
    this.songs = [];
}

var getCurrentUserPlaylists = function () {
    return CRUD.GET("playlists?userId=" + currentUser.id);
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
var currentPlaylist = new Playlist("und");
var currentUser;
var currentSongId; //voor options
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
};

/* BACK-END AUDIO */
var audioPlayer = {
    autoplay: false,
    goToSongs: function () {
        currentPlaylist = getSongs();
    },
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
            currentPlaylist.name = data.playlists[playlistid - 1].name;
            currentPlaylist.songs = data.playlists[playlistid - 1].songs;
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


//moet hiervoor de array editen ipv te adden
function addSongToPlaylist(selectedSong, selectedPlaylist) {
    console.log(selectedPlaylist)
    var object;
    var text;
    var url = "/playlists?userId=" + currentUser.id + "&id=" + selectedPlaylist.id;

    CRUD.GET(url).then(function (data) {

        object = data[0];
        object.songs.push(selectedSong);
    }).then(function () {
        CRUD.PATCH("/playlists/" + selectedPlaylist.id, object);
    }).then(function () {
        text = selectedSong.title + " has been added to your playlist.";
        mainUI.switchPopup("#selectplaylist", "#messagepopup", text, "p")
    }); /*.catch(function () {
        text = "unable to add song.";
        mainUI.switchPopup("#selectplaylist", "#messagepopup", text, "p")
    })*/


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
    return text.replace('\"', '').replace('\'', '').replace('\,', '').replace('\\', '');
}

var userFunctions = {
    //setUser as default for testing and stuff
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
        var password = sanatize($("#regpassword").val());
        /*var passwordHash = require('password-hash');
         var hashedPassword = passwordHash.generate(password);*/

        var hashedPassword = password.hashCode();
        console.log(hashedPassword);
        var User = {
            //"id": userFunctions.checkIdUser(),
            "name": sanatize($("#regusername").val()),
            "email": sanatize($("#regemail").val()),
            "nickname": sanatize($("#regnickname").val()),
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
            url: "/users",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(User),
            dataType: "json"
        })
    },

    makeNewPlaylist: function (e) {
        e.preventDefault();
        var playlistname = $("#playlistname").val();
        var playlist = {
            name: playlistname,
            songs: [],
            userId: JSON.parse(currentUser.id)
        };

        $.ajax({
            url: "/playlists?userId=" + currentUser.id,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(playlist),
            dataType: "json"
        }).then(function (data) {
            mainUI.switchPopup("#makeplaylistform", "#messagepopup", data.name + "has been added successfully", "p");
        });
        //$("#makeplaylistform").popup("close")

    },

};

String.prototype.hashCode = function () {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
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
                "</a> <a class='optionssong ui-btn ui-btn-icon-notext ui-icon-gear' href='#songoptions' data-position-to='origin' data-rel='popup' data-transition='slideup'></a></li>";
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
        $(".settings").off().on('click', mainUI.goToSettings);
        $(".register").off().on('click', mainUI.goToRegister);
        $("#autoplay").change(audioPlayer.setAutoplay);
        $("[data-name='songs'] [data-role='listview'] ").off().on('click', '.playsong', audioPlayer.selectSong);
        $(".autoplay").off().on('click', audioPlayer.setAutoplay);
        $("[data-name='playlists'] [data-role='listview']").off().on("click", '.selectplaylist', audioPlayer.setPlaylist);
        $(".mysongs").off().on("click", getSongs);
        $("#login").off().on("click", userFunctions.loginUser);
        $("#register").off().on("submit", userFunctions.addUser);
        $("#makeplaylist").off().on("click", userFunctions.makeNewPlaylist);
        $("[data-name='songs'] [data-role='listview'] ").off().on('click', ".optionssong", mainUI.getSelectedSongId);
        $(".showplaylists").off().on('click', playlistsUI.showPlaylists);
        //$("#selectplaylist").off().on('click', "ul li a", addSongToPlaylist)

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
    showMessage: function (text, popupid, tag) {
        $(popupid + " " + tag).append(text);
        $(popupid).popup("open");
    },
    switchPopup: function (toClosePopup, toOpenPopupId, text, tag) {
        $(toClosePopup).off().on({
            popupafterclose: function () {
                setTimeout(function () {
                    mainUI.showMessage(text, toOpenPopupId, tag)
                })
            }
        });
        $(toClosePopup).popup("close");
    },

    getSelectedSongId: function () {
        currentSongId = $(this).parent().attr("data-id");
    }
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
        playlists.append("<li class=' ui-li-has-thumb ui-first-child ui-last-child'>" +
            "<a class='playsong ui-btn' href='#makeplaylistform' data-position-to='center' data-rel='popup' data-transition='pop'>" +
            "<img src='../../images/covers/defaultcover.jpg' />" +
            "<h2> Add new Playlist </h2>" +
            "</a></li>");
    },
    showPlaylists: function () {
        var playlists = "", selectedSong;
        console.log(currentSongId)
        var list = $("#selectplaylist ul");

        getCurrentUserPlaylists().then(function (data) {
            list.children().remove();
            for (var i = 0; i < data.length; i++) {
                playlists += "<li><a href='#' class='ui-btn'>" + data[i].name + "</a></li>";
            }
        }).then(function () {
            list.append('<li class="ui-li-divider ui-bar-inherit ui-first-child" data-role="list-divider">' +
                'Select your playlist.</li>')
        }).then(function () {
            mainUI.switchPopup("#songoptions", "#selectplaylist", playlists, "ul");
            $("#selectplaylist ul").off().on('click', "li a", function () {
                var selectedPlaylist = $(this).text()
                CRUD.GET("/songs/" + currentSongId).then(function (data) {
                    selectedSong = data;
                    getPlaylist(selectedPlaylist).then(function (data) {
                        selectedPlaylist = data[0];
                        console.log(selectedPlaylist)
                    }).then(function () {
                        addSongToPlaylist(selectedSong, selectedPlaylist)
                    });
                })
            })
        })
    }
};

$(function () {
    userFunctions.setUser();
    mainUI.bindEvents();
    setAudioEventListeners();
    registerServiceWorker();
});