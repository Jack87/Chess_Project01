var abChess = {};
var options = {
    animated: true,
    animationSpeed: 6,
    width: 700,
    reversed: false
};
// renderBoard()
var players = {
    p1 : {
        id    : "",
        name  : "",
        wins  : 0,
        losses: 0,
        side  : "",
        board : "",
        key   : ""
    },
    p2 : {
        id    : "",
        name  : "",
        wins  : 0,
        losses: 0,
        side  : "",
        board : "",
        key   : ""
    },
    pS :{
      id    : "",
      name  : "",
      wins  : 0,
      losses: 0,
      side  : "",
      board : "",
      key   : ""
    },
    activeSpectators: [],
    totalConnections: 0
};
var user = {
    role     : "",
    key      :  "",
    side     : "",
    lastMove : ""
};
var lastMove1 = "";
var gameState = 0;
var turn = "";

// Initialize Firebase
var config = {
    apiKey: "AIzaSyDyYn3P_g3TD5YG3nHiblFk10x_415J0ns",
    authDomain: "colabchess-11256.firebaseapp.com",
    databaseURL: "https://colabchess-11256.firebaseio.com",
    projectId: "colabchess-11256",
    storageBucket: "colabchess-11256.appspot.com",
    messagingSenderId: "653235100760"
  };
    firebase.initializeApp(config);
    var database = firebase.database();

//Players already playing?
database.ref("/players").on("value", function(snapshot) {
    if (snapshot.child("1/name").exists()) {
        // save to global var
        players.p1.name = snapshot.child("1/name").val();
        players.p1.side = snapshot.child("1/side").val();
        // render to DOM
        if (players.p1.side == "white") {
          $("#whiteSide").html('<i class="far fa-user"></i> ' + players.p1.name);
          if (user.role !== "player1"){
            $("#choiceBlack").attr('checked', true);
          }
        }
        if (players.p1.side == "black") {
          $("#blackSide").html('<i class="fas fa-user"></i> ' + players.p1.name);
          if (user.role !== "player1"){
            $("#choiceBWhite").attr('checked', true);
          }
        }
        // if (user.role !== "player1"){
          $(".colorChoice").attr('disabled', true);
        // }
        // save connection keys
        players.p1.key = snapshot.child("1/key").val();
    }
    if (snapshot.child("2/name").exists()) {
        // save to global var
        players.p2.name = snapshot.child("2/name").val();
        players.p2.side = snapshot.child("2/side").val();
        // render to DOM
        if (players.p2.side == "white") {
          $("#whiteSide").html('<i class="far fa-user"></i> ' + players.p2.name);
        }
        if (players.p2.side == "black") {
          $("#blackSide").html('<i class="fas fa-user"></i> ' + players.p2.name);
        }
        // save connection keys
        players.p2.key = snapshot.child("2/key").val();
        // hide input but maintain height
        // $("#joinForm").hide();
    }
});

/* // Switch statment determins case to use depending on game state from DB
// gameState = 0, new game with no players
// gameState = 1, player one's turn
// gameState = 2, player two's turn
// gameState = 3, results
database.ref("/game").on("value", function(gameStateStatus) {
    if(gameStateStatus.child("gameState").exists()) {
      switch (gameStateStatus.val().gameState) {
        case 0:
          // new game, not programmed yet
          break;
        case 1:
          // show chatbox
          $(".chatLog").slideDown();
          // reset player choices
          resetWeaponButton();
          // enable player1 buttons
          if (user.role === "player1") {
            statusUpdate("Your turn. Shoot!");
            $(".player1 button").css("visibility", "visible");
            enableWeaponButton(user.role);
            resetFist(".player2 button img", ".player2 button");
          }
          if (user.role === "player2" || user.role == "") {
            statusUpdate(players.p1.name+" is shooting...");
          }
          if (user.role === "player2") {
            resetFist(".player1 button img", ".player1 button");
          }

          break;
        case 2:
          if (user.role === "player1" || user.role == "") {
            statusUpdate(players.p2.name+" is shooting...");
          }
          if (user.role === "player2") {
            // enable player2 buttons
            statusUpdate("Your turn. Choose your weapon!");
            $(".player2 button").css("visibility", "visible");
            enableWeaponButton(user.role);
          }
          if (user.role === "") {
            showP1Choice(weapons.names.indexOf(gameStateStatus.val().p1choice));
          }
          break;
        case 3:
          // update status message
          statusUpdate("Round complete!");
          // get choices from db
          var p1choice = gameStateStatus.val().p1choice.toLowerCase();
          var p2choice = gameStateStatus.val().p2choice.toLowerCase();
          // show choices made
          $(".card button").css("visibility", "visible");
          $(".player1 ."+p1choice).addClass('active');
          $(".player2 ."+p2choice).addClass('active');
          // show winner
          postWinner(p1choice, p2choice);
          break;
      } // end switch
    }
}); */

// Handling Gamestate to stay sync
var gStateVal = database.ref("/game/gameState");
gStateVal.on("value", function(snapState) {
    gameState = snapState.val();
});

/* ===== Connection handaling and chat. ===== */
// Chatbox live
database.ref("/chatBox").orderByChild("dateAdded").limitToLast(1).on("child_added", function(snapshot){
    var output = "<div class='msg'><span class='speaker'>";
    output += "<strong>" + snapshot.val().name + "</strong>";
    output += ":</span> <span class='msgContent'>";
    output += snapshot.val().message;
    output += "</span></div>";
    $(".chatLog").append(output);

    var logElement = document.getElementById('chatLog');
    logElement.scrollTop = logElement.scrollHeight - logElement.clientHeight;
});

// Handling disconnects
var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

connectedRef.on("value", function(snap) {
    if (snap.val()) {
      var con = connectionsRef.push(true);
      console.log(con.onDisconnect())
      user.key = con.key;
      con.onDisconnect().remove();
    }
});

connectionsRef.on("value", function(snap) {
    $("#watchers").html("Current users: " + snap.numChildren());
});

connectionsRef.on("child_removed", function(removedKey) {
    // if the key of removed child matches one of the players, remove them
    if (removedKey.key === players.p1.key) {
        // statusUpdate(players.p1.name + " disconnected!");
        database.ref("/players/1").remove();
        // clear locally so new player can be added
        players.p1.name = "";
        if(user.role!=="player2") {
            // $("#joinForm").show();
            user.role = "";
        }
        // resetRound();
    } else if(removedKey.key === players.p2.key) {
        // statusUpdate(players.p2.name + " disconnected!");
        database.ref("/players/2").remove();
        // clear locally so new player can be added
        players.p2.name = "";
        if(user.role!=="player1") {
            // $("#joinForm").show();
            user.role = "";
        }
        // resetRound();
    }
});

// Handling opponet's move
var lastMoveRef = database.ref("/lastMove");
lastMoveRef.on("value", function(snap) {
  if (snap.val()) {
    if (snap.child("side").val() != user.side){
      var startSquare = snap.child("move/0").val();
      var endSquare = snap.child("move/1").val();
      abChess.play(startSquare, endSquare);
      console.log("Opponent moved from " + startSquare + " to " + endSquare + ".")
    }
  } 
});

$(document).ready(function() {

  // abChess.onMovePlayed(afterMove);
    //Reset button for debugging and clearing DB data
    $("#resetButton").click(function(event){
        event.preventDefault();
        database.ref().remove()
        .then(function() {
          // console.log("Reset succeeded.");
          location.reload();
        });
      });
      $("#chatForm").submit(function(event){
        event.preventDefault();
        var message = $("#chatMessage").val().trim();
        // clear input
        $("#chatMessage").val("");
        var chatUser;
        if(user.role==="player1") {
          chatUser = players.p1.name;
        } else if (user.role==="player2") {
          chatUser = players.p2.name;
        }
        database.ref("/chatBox").push({
          name    : chatUser,
          message : message
        });
      });
      
});
  //Reset button for debugging and clearing DB data
  $("#resetButton").click(function(event){
    event.preventDefault();
    database.ref().remove()
    .then(function() {
      // console.log("Reset succeeded.");
      location.reload();
    });
  });
  $("#moveButton").click(function(event){
      event.preventDefault();
      abChess.play("d2", "d6");

  });
 // Player registration
 $("#joinForm").submit(function(event){
  // don't refresh page on submit
  var colorChoice = $("input[name='colorChoice']:checked").val();
  console.log (colorChoice);
  event.preventDefault();
  if (players.p1.name==="") {
    players.p1.name = toTitleCase($("#nameInput").val().trim());
    players.p1.side = colorChoice;
    user.role = "player1";
    user.side = colorChoice;
    // write name to DOM
    if (colorChoice == "white") {
      $("#whiteSide").html('<i class="far fa-user"></i> ' + players.p1.name);
    }
    if (colorChoice == "black") {
      $("#blackSide").html('<i class="fas fa-user"></i> ' + players.p1.name);
      options.reversed = true;
    }
    // statusUpdate("Hi, "+players.p1.name+"! You're player 1. Waiting for another player to join.");
    // write to db
    database.ref("/players/1").update({
      key   : user.key,
      name  : players.p1.name,
      wins  : players.p1.wins,
      losses: players.p1.losses,
      losses: players.p1.losses,
      side: colorChoice
    });
    gameState = 0;
    database.ref("/game").update({
        gameState: gameState
    });
    // $(this).hide();
  } else if (players.p2.name===""){
    players.p2.name = toTitleCase($("#nameInput").val().trim());
    // set user global variable to player 2
    players.p2.side = colorChoice;
    user.role = "player2";
    user.side = colorChoice;
    // write name to DOM
    if (colorChoice == "white") {
      $("#whiteSide").html('<i class="far fa-user"></i> ' + players.p2.name);
    }
    if (colorChoice == "black") {
      $("#blackSide").html('<i class="fas fa-user"></i> ' + players.p2.name);
      options.reversed = true;
    }
    $(".player2 h4").html(players.p2.name);
    // write player name to db
    database.ref("/players/2").update({
      key   : user.key,
      name  : players.p2.name,
      wins  : players.p2.wins,
      losses: players.p2.losses,
      side: colorChoice
    });
    statusUpdate("Hey, "+players.p2.name+"! You're player 2. Waiting for "+players.p1.name+" to make a move.");
    // start game by storing turn in database
    gameState = 1;
    database.ref("/game").update({
        gameState: gameState
    });
  }
  statusUpdate("")
  renderBoard();
      // var scrollingElement = (document.scrollingElement || document.body);
    // scrollingElement.scrollTop = scrollingElement.scrollHeight;
});

//Functions
// Render Board
function renderBoard() {
  abChess = new AbChess("chessboard", options);
  abChess.setFEN();
  abChess.onMovePlayed(afterMove);
}
//After a move is playe
function afterMove() {  
  user.lastMove = abChess.getLastMove()
  var pgnText= abChess.getPGN()
  statusUpdate(pgnText);
  database.ref("/lastMove").update({
    side  : user.side,
    move  : user.lastMove,
    pgnLog: pgnText
  });
  // gameState = 0;
  // database.ref("/game").update({
  //     gameState: gameState
  // });
}
// function getLastMove() {
//   var startSquare = abChess.board.game.moves[board.currentMoveIndex].start;
//   console.log(startSquare);
//   var endSquare = abChess.board.game.moves[board.currentMoveIndex].arrival;
//   console.log(endSquare);
//   lastMove1 = startSquare + ", " + endSquare;
//   console.log(lastMove1)
// }
// Update status message
function statusUpdate(msg) {
  $(".status").html(msg);
};
//Title Case a string
function toTitleCase(str)
{
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}