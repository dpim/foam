SC.initialize({
  client_id: 'soundcloud-client-id-goes-here'
});

var tracklist = [];
var capable = false;
var scPlayer;
var currSong = 0;
var remainingDur = 0;
var decrement = 0;

//request new hot tracks, resolve urls via soundcloud api
$(document).ready(function() {
  $('#state').text("loading...")
  disable();
  var searchTracks;
  var scTracks;
  $.get( "/fire", function(data){
    scTracks = data["sc"];
    searchTracks = data["search"];
  }).then(function(){
    for (var i = 0; i < scTracks.length; i++){
      SC.get("/resolve/?url="+scTracks[i], {limit: 1}, function(result){
            tracklist = tracklist.concat(scTracks[i]);
        });
    }
    for (var i = 0; i < searchTracks.length; i++){
      SC.get('/tracks', {q: searchTracks[i], limit:1}).then(function(tracks) {
        var tempTrack = tracks[0];
        tracklist = tracklist.concat(tempTrack["permalink_url"]);
      });
    }
  }).then(function(){
    window.setInterval(tryToPlay, 1000);
  });
});

//check if able to play or song needs changing
function tryToPlay(){
  if (!capable){
    //console.log(tracklist);
    if (tracklist.length > 1){
        var firstItem = tracklist[currSong];
        scPlayer = new SoundCloudAudio('13233fb60dac1ec2d8211f30c390462b');
        playSong(firstItem);
        enable();
        $('#state').text("")
        capable = true;
    }
  } else if (scPlayer && remainingDur < 0) {
    next();
  }
}

//begins a new song and starts timing
function playSong(songURL){
  scPlayer.resolve(songURL, function(err, track){
    window.clearInterval(decrement);
    decrement = null;
    scPlayer.play();
    var DURATION_OFFSET = 2.0;
    remainingDur = scPlayer.duration - DURATION_OFFSET;
    decrement = window.setInterval(startTimer, 1000);
    $('#state').text("")
  });
}

//reorders tracks
function shuffleTracks(){
  var tempTracks = Array.apply(null, Array(tracklist.length)).map(Number.prototype.valueOf,0);
  for (var i = 0; i < tracklist.length; i++){
    var swap = Math.floor(Math.random() * tracklist.length);
    tempTracks[swap] = tracklist[i];
    tempTracks[i] = tracklist[swap];
  }
  tracklist = tempTracks;
}

//song timer
function startTimer(){
  remainingDur = remainingDur-1;
}

//button disable
function disable(){
    $("#next").prop("disabled",true);
    $("#prev").prop("disabled",true);
    $("#shuffle").prop("disabled",true);
}

//button enable
function enable(){
  $("#next").prop("disabled",false);
  $("#prev").prop("disabled",false);
  $("#shuffle").prop("disabled",false);
}

//previous song
function prev(){
  if (currSong > 0){
    disable();
    $('#state').text("changing tracks...")
    currSong = currSong-1;
    playSong(tracklist[currSong]);
    enable();
  }
}

//next song
function next(){
  if (currSong < tracklist.length-1){
    disable();
    $('#state').text("changing tracks...")
    currSong = currSong+1;
    playSong(tracklist[currSong]);
    enable();
  }
}

//reorder song
function shuffle(){
  $('#state').text("moving things around...")
  disable();
  shuffleTracks();
  playSong(tracklist[currSong]);
  enable();
}

//button handlers
$(document).on("click", "#prev", function(){
  prev();
});

$(document).on("click", "#next", function(){
  next();
});

$(document).on("click", "#shuffle", function(){
  shuffle();
});
