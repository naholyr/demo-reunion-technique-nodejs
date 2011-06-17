
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function () {
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function (req, res) {
  res.render('index', {
    title: 'Express'
  });
});



// Socket.IO

var io = require('socket.io');
var server = io.listen(app);

var data = {
  "time": null,
  "nbLoses": {},
  "nbWins": {},
  "names": {},
  "increment": 1,
}

function getPlayerNames (except) {
  var names = [];
  for (var id in server.clients) {
    if (data.names[id] && (!except || data.names[id] != except)) {
      names.push(data.names[id]);
    }
  }
  return names;
}
function generateName () {
  return 'player' + (data.increment ++);
}
function getClient (playerName) {
  for (var id in server.clients) {
    if (server.clients[id].playerName == playerName) {
      return server.clients[id];
    }
  }
  return null;
}

server.on('connection', function (client) {
  // Initialiser le joueur
  var playerName = data.names[client.sessionId] = generateName();
  console.log('Client %s : %s', client.sessionId, playerName);
  data.nbWins[playerName] = 0;
  data.nbLoses[playerName] = 0;
  var players = getPlayerNames();
  // Dire à tout le monde qu'un nouveau joueur est arrivé
  server.broadcast({"connect": playerName, "players": players});
  // Envoyer au joueur son nom et la date du dernier tirage
  client.send({"name": playerName, "time": data.time, "players": players});
  // Si le joueur quitte la partie, prévenir tout le monde aussi
  client.on('disconnect', function () {
    client.broadcast({"disconnect": playerName, "players": getPlayerNames(playerName)});
  });
  // Renommage
  client.on('message', function (msg) {
    if (msg.rename && msg.rename != playerName) {
      console.log('Demande de renommage %s en %s', playerName, msg.rename);
      // Vérifier que le nom n'est pas déjà pris
      var other = getClient(msg.rename);
      if (other) {
        client.send({"error": "name-already-in-use", "whosessid": other.sessionId, "whoname": msg.rename});
        other.send({"error": "steal-name", "who": playerName});
      } else {
        var oldName = playerName;
        playerName = data.names[client.sessionId] = msg.rename;
        data.nbWins[playerName] = data.nbWins[oldName];
        data.nbLoses[playerName] = data.nbLoses[oldName];
        delete data.nbWins[oldName];
        delete data.nbLoses[oldName];
        var players = getPlayerNames();
        server.broadcast({"rename": [oldName, playerName], "players": players});
      }
    }
  });
});

function tirage () {
  data.time = Date.now();
  console.log('Tirage %s', new Date(data.time).toString());
  var playerNames = getPlayerNames();
  if (playerNames.length > 2) {
    var winnerName = playerNames[Math.floor(Math.random() * playerNames.length)];
    console.log('Winner: %s', winnerName);
    for (var id in server.clients) {
      var client = server.clients[id];
      var playerName = data.names[id];
      var msg = {"time": data.time, "winner":winnerName};
      if (playerName == winnerName) {
        data.nbWins[playerName]++;
        msg.win = true;
      } else {
        data.nbLoses[playerName]++;
        msg.lose = true;
      }
      msg.nbWins = data.nbWins[playerName];
      msg.nbLoses = data.nbLoses[playerName];
      client.send(msg);
    }
  } else {
    console.log('Annulation');
    server.broadcast({"cancel": true, "time": data.time});
  }
  var delay = 5 + Math.floor(Math.random() * 10);
  console.log('Prochain tirage dans %s secondes', delay);
  setTimeout(tirage, delay * 1000);
}

app.on('listening', tirage); // Tirage initial



// Listening

app.on('listening', function () {
  console.log("Express server listening on port %d", app.address().port);
});

if (require.main === module) {
  app.listen(3000);
}
