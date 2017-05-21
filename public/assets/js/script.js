/**
 * Created by Renzie on 16/02/2016.
 */
/*  TODO :
 - PUSH NOTIFICATIONS
 - LOGIN
 - ....

 DONE : - MUZIEKSPELER (PLAY - PAUSE, NEXTSONG, SONG ON CLICK, )
 - PROGRESS BAR VOOR MUZIEK
 - MANIFEST
 - NIEUWE PLAYLISTS AANMAKEN
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
    PATCH: function (url, object) {
        $.ajax({
            url: url,
            type: 'PATCH',
            data: JSON.stringify(object),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                console.log(data)
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 500) {
                    alert(thrownError);
                }
            }
        })
    }
};

var getAllSongs = () => {
    return CRUD.GET("/songs").then((data) => {
        currentPlaylist = new Playlist("All Songs");
        for (var i = 0; i < data.length; i++) {
            currentPlaylist.songs.push(data[i]);
        }
    }, (error) => {
        console.log(error)
    }).then(() => {
        console.log(currentPlaylist.songs);
        $(".currentPlaylist").children().remove();
        for (var i = 0; i < currentPlaylist.songs.length; i++) {
            audioplayerUI.fillPlaylistUI(currentPlaylist.songs[i]);
        }
        mainUI.goToSongs();

    });
};


var getSong = function (id) {
    return CRUD.GET("/songs?id=" + id)
}

var getPlaylist = function (name) {
    return CRUD.GET('/playlists?name=' + name);
};

var getPlaylistById = function (id) {
    return CRUD.GET('/playlists?id=' + id);
};

var getSongsFromSelectedPlaylist = function (playlistid) {
    return getPlaylistById(playlistid).then((data) => {
        $(".currentPlaylist").children().remove();
        currentPlaylist = new Playlist();
        currentPlaylist = data[0];
        for (var i = 0; i < currentPlaylist.songs.length; i++) {
            getSong(currentPlaylist.songs[i]).then((songdata) => {
                currentPlaylist.songs[i] = songdata[0];
            }).then(()=> {
                audioplayerUI.fillPlaylistUI(currentPlaylist.songs[i]);

            });
        }
    })
};

var getPlaylists = function () {
    return getCurrentUserPlaylists().then(function (data) {
        playlistsUI.loadPlaylists(data);
    }, function (error) {
        console.log(error)
    })
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
                    //checkSubscription();
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


/* AUDIOPLAYER SETTINGS */
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
    setAutoplay: function () {
        audioPlayer.autoplay = !!$(this).is(':checked');
    },
    setSong: function (id) {
        console.log("id : " + id)
        return getSong(id).then((data) => {
            currentSong = data[0];
            console.log(currentSong);
            audio.src = '../songlist/' + currentSong.mp3;
            audioplayerUI.updateSongTitle();
            console.log(audio.src)
        });

    },
    playSong: function () { // speel de current song af, indien er nog geen song afgespeeld is speel je de eerste song
        audio.play();
        audioplayerUI.resumeOrPause();
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

            audioPlayer.setSong(currentSong.id + 1).then(() => {
                audioPlayer.playSong()
            });

        }
    },
    previousSong: function () {
        if (currentSong == undefined) {
            audioPlayer.playFirstSong();
        } else {
            audioPlayer.setSong(currentSong.id - 1).then(() => {
                audioPlayer.playSong()
            });

        }
    },
    selectSong: function () {
        var songId = $(this).parent().attr("data-id");
        audioPlayer.setSong(songId).then(() => {
            audioPlayer.playSong();
        });

    },
    setPlaylist: function () {
        var playlistid = $(this).parent().attr('data-id');
        return getSongsFromSelectedPlaylist(playlistid).then(() => {
            mainUI.goToSongs();
        }, function (error) {
            console.log(error)
        })
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
        object.songs.push(JSON.parse(selectedSong));
    }).then(function () {
        CRUD.PATCH("/playlists/" + selectedPlaylist.id, object)
    }).then(function () {
        text = "Song has been added to your playlist.";
        mainUI.switchPopup("#selectplaylist", "#messagepopup", text, "p")
    });
    /*.catch(function () {
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
        var loginAttempt = $.get("/users/" + userId);
        return loginAttempt.then((data) => {
            console.log(data.login)
            return data.login <= 3;

        })
    },

    incrLoginAttempts: function (userId) {
        var object;
        return $.get("/users/" + userId).then((data) => {
            object = data;
            object.login += 1;
            CRUD.PATCH("/users/" + userId, object).then(() => {
                console.log("failed login or password");

            })
        });
    },

    resetLoginAttempts: function (userId) {
        var object;
        return CRUD.GET("/users/" + userId).then((data) => {
            object = data;
            object.login = 0;
        }).then(() => {
            return CRUD.PATCH("/users/" + userId, object);
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

    loginUser: function (e) {
        e.preventDefault()
        var users = $.get("/users");
        var username = sanatize($("#username").val());
        var password = sanatize($("#password").val());


        return users.then(function (data) {
            for (var i = 0; i < data.length; i++) {
                if (username === data[i].nickname) {
                    if (userFunctions.checkLoginAttempts(data[i].id)) {
                        if (password.hashCode() === data[i].password) {
                            userFunctions.resetLoginAttempts(data[i].id);
                            userFunctions.setUser(data[i].id);
                            mainUI.goToMainPage();
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
        console.log("test   ")
        var hashedPassword = password.hashCode();
        console.log(hashedPassword);
        var User = {
            //"id": userFunctions.checkIdUser(),
            "name": sanatize($("#regusername").val()),
            "email": sanatize($("#regemail").val()),
            "nickname": sanatize($("#regnickname").val()),
            "password": hashedPassword,
            "login": 0,
            "records": {
                /*"id" : "",
                 "title": "",
                 "mp3":""*/
            },
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

    updatePlaylistTitle: () => {
        $("header section h2").text(currentPlaylist.name)
    },

    fillPlaylistUI: function (data) {
        var html = "<li data-id='" + data.id + "' class='song ui-li-has-alt ui-li-has-thumb ui-first-child ui-last-child'><a class='playsong ui-btn' href='#'>" +
            "<img src='../../images/covers/defaultcover.jpg' />" +
            "<h2>" + data.title + "</h2>" +
            "<p>" + data.author + "</p>" +
            "</a> <a class='optionssong ui-btn ui-btn-icon-notext ui-icon-gear' href='#songoptions' data-position-to='origin' data-rel='popup' data-transition='slideup'></a></li>";
        $(".currentPlaylist").append(html);
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
        $(".autoplay").off().on('click', audioPlayer.setAutoplay);
        $("[data-name='playlists'] [data-role='listview']").off().on("click", '.selectplaylist', audioPlayer.setPlaylist);
        $(".mysongs").off().on("click", getAllSongs);
        $("[data-name='songs'] .currentPlaylist").off().on('click', 'a.playsong', audioPlayer.selectSong);
        $("#login").off().on("click", userFunctions.loginUser);
        $("#register").on("click", userFunctions.addUser);
        $("#makeplaylist").off().on("click", userFunctions.makeNewPlaylist);
        $("[data-name='songs'] [data-role='listview'] ").on('click', "a.optionssong", mainUI.getSelectedSongId);
        $(".showplaylists").off().on('click', playlistsUI.showPlaylists);
        //$("#selectplaylist").off().on('click', "ul li a", addSongToPlaylist)

    },

    loadContent: function (dataname) {
        $("[data-role='main']").fadeOut();
        setTimeout(function () {
            $("[data-name='" + dataname + "']").fadeIn();
        }, 100)
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
        audioplayerUI.updatePlaylistTitle();
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

    getSelectedSongId: function (e) {
        currentSongId = $(this).parent().attr("data-id");
    },

    goToMainPage: function () {
        $.mobile.changePage("Main.html", {
            transition: "pop",
            changeHash: false
        })
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
                CRUD.GET("/songs/" + currentSongId).then(function () {
                    getPlaylist(selectedPlaylist).then(function (data) {
                        selectedPlaylist = data[0];
                        console.log(selectedPlaylist)
                    }).then(function () {
                        addSongToPlaylist(currentSongId, selectedPlaylist)
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