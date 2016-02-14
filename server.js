var http = require("http");
var express = require('express');
var Snoocore = require('snoocore');
var app = express();
var port = process.env.PORT || 1337;
app.use("/", express.static(__dirname));

var reddit = new Snoocore({
  userAgent: '/u/foam_test foam@3.0.0', // unique string identifying the app
  oauth: {
    type: 'script',
    key: 'key goes here', // OAuth client key (provided at reddit app)
    secret: 'secret goes here', // OAuth secret (provided at reddit app)
    username: 'reddit user name here', // Reddit username used to make the reddit app
    password: 'reddit password here', // Reddit password for the username
    // The OAuth scopes that we need to make the calls that we
    // want. The reddit documentation will specify which scope
    // is needed for evey call
    scope: ['identity',  'read' ]
  }
});

//get your cool tracks from reddit
app.get('/fire', function (req, res) {
  var scUrls = [];
  var searchNames = [];
  var slices = [];
  reddit('/r/music/hot').listing().then(function(slice) {
      var musicData = parseToVars(slice.children);
      scUrls = scUrls.concat(musicData['sc']);
      searchNames = searchNames.concat(musicData['search']);
  }).then(function(slice) {
    reddit('/r/hiphopheads/hot').listing().then(function(slice) {
      var hipHopData = parseToVars(slice.children);
      scUrls = scUrls.concat(hipHopData['sc']);
      searchNames = searchNames.concat(hipHopData['search']);
      })
  }).then(function(slice) {
    reddit('/r/listentothis/hot').listing().then(function(slice) {
      var ltData = parseToVars(slice.children);
      scUrls = scUrls.concat(ltData['sc']);
      searchNames = searchNames.concat(ltData['search']);
      var resp = {'sc':scUrls, 'search':searchNames};
      res.send(resp);
    });
  });
});

app.listen(port, function () {
  console.log('Listening on port 3000!');
});

//parse reddit json to soundcloud url bucket and youtube search term bucket
function parseToVars(redditArr){
  var tempSCUrls = [];
  var tempSearchNames = [];
  for (var i = 0; i < redditArr.length; i++){
    var post = redditArr[i];
    postData = post['data'];
    if (postData['domain'] == 'soundcloud.com'){
      tempSCUrls.push(postData['url']);
    } else if (postData['domain'] == 'youtube.com'){
      var title = postData['title'];
      title = trimBrackets(title);
      tempSearchNames.push(title);
    }
  }
  return {'sc':tempSCUrls,'search':tempSearchNames};
}

//removes text decoration
function trimBrackets(str){
  var openBracket = false;
  var tempStr = "";
  for (var i = 0; i < str.length; i++){
    var currChar = str.charAt(i);
    if (currChar == '[' || currChar == '('){
      openBracket = true;
    } else if (currChar == ']' || currChar == ')'){
      openBracket = false;
    } else if (openBracket == false){
      tempStr = tempStr + currChar;
    }
  }
  return tempStr.trim();
}
