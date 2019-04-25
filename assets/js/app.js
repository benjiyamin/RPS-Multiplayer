function Application(messages) {
  let self = this
  this.player

  let config = {
    apiKey: "AIzaSyAA1yX2Ku9WyK8OfnGn_zjpgm2ZhPlvAXE",
    authDomain: "multiplayer-rps-f9ed9.firebaseapp.com",
    databaseURL: "https://multiplayer-rps-f9ed9.firebaseio.com",
    projectId: "multiplayer-rps-f9ed9",
    storageBucket: "multiplayer-rps-f9ed9.appspot.com",
    messagingSenderId: "992731580471"
  };
  firebase.initializeApp(config);
  let database = firebase.database()

  this.opponent = function () {
    if (self.player === 1) {
      return 2
    } else if (self.player === 2) {
      return 1
    }
  }

  this.choiceToImg = function (imgSelector, choice) {
    let $img = $(imgSelector)
    let src
    if (choice) {
      $img.closest('.flip-container').addClass('flipped')
      if (choice === 'fire') {
        src = 'assets/images/fire.png'
      } else if (choice === 'water') {
        src = 'assets/images/water.png'
      } else if (choice === 'leaf') {
        src = 'assets/images/leaf.png'
      }
      $img.attr('src', src)
    } else {
      $img.closest('.flip-container').removeClass('flipped')
      let src = 'assets/images/playing-card-back.png'
      setTimeout(function () {
        $img.attr('src', src)
      }, 600);
    }
  }

  this.reveal = function (choice2) {
    this.choiceToImg('#img2', choice2)
  }

  this.reset = function () {
    this.choiceToImg('#img1')
    this.choiceToImg('#img2')
    //$('.flip-container').removeClass('flipped')
  }

  this.result = function (gameData) {
    let userChoice = this.userChoice(gameData)
    let opponentChoice = this.opponentChoice(gameData)
    if (userChoice === opponentChoice) {
      return 'tie'
    } else if ((userChoice === 'leaf' && opponentChoice == 'water') || (userChoice === 'fire' && opponentChoice == 'leaf') || (userChoice === 'water' && opponentChoice == 'fire')) {
      return 'win'
    } else {
      return 'lose'
    }
  }

  this.userChoice = function (gameData) {
    if (self.player === 1) {
      return gameData.p1.choice
    } else if (self.player === 2) {
      return gameData.p2.choice
    }
  }

  this.opponentChoice = function (gameData) {
    if (self.player === 2) {
      return gameData.p1.choice
    } else if (self.player === 1) {
      return gameData.p2.choice
    }
  }

  let gameRef = database.ref('game')

  // Whenever a player is added
  gameRef.on('child_added', function (snapshot) {
    gameRef.once('value').then(function (gameSnap) {
      if (gameSnap.child("p" + self.opponent()).exists()) {
        // Opponent is added
        messages.displayChoiceMsg()
      } else {
        // User is added
        messages.displayMsg('Looking for an opponent to play against..', looking = true)
      }
    })
  })

  // Choice logic
  this.updateAfterChoice = function (gameRef) {
    gameRef.once('value').then(function (gameSnap) {
      let gameData = gameSnap.val()
      let choice1 = gameSnap.child("p1/choice")
      let choice2 = gameSnap.child("p2/choice")
      if (choice1.exists() && choice2.exists()) {
        // choices made
        if (self.result(gameData) === 'win') {
          messages.displayRestartMsg('Nice! You won this round. ')
          let wins = 1
          if (gameSnap.child("p" + self.player + "/wins").exists()) {
            wins += gameData['p' + self.player].wins
          }
          database.ref('game/p' + self.player).update({
            wins: wins
          });
          $('#winsText').text(wins)
        } else if (self.result(gameData) === 'lose') {
          messages.displayRestartMsg('Sorry, you lose this round. ')
          let losses = 1
          if (gameSnap.child("p" + self.opponent() + "/wins").exists()) {
            losses += gameData['p' + self.opponent()].wins
          }
          $('#lossesText').text(losses)
        } else if (self.result(gameData) === 'tie') {
          messages.displayRestartMsg('Looks like a tie. ')
        }

        self.reveal(self.opponentChoice(gameData))
      } else if (gameSnap.child("p" + self.player + "/choice").exists()) {
        // User choice is made is added
        messages.displayMsg('Waiting for the other player to make choice..')
      }
    })
  }

  // Player 1 choice is made
  database.ref('game/p1/choice').on('value', function (snapshot) {
    self.updateAfterChoice(gameRef)
  })

  // Player 2 choice is made
  database.ref('game/p2/choice').on('value', function (snapshot) {
    self.updateAfterChoice(gameRef)
  })

  // Restart logic
  this.updateAfterRestart = function (gameRef) {
    gameRef.once('value').then(function (gameSnap) {
      let gameData = gameSnap.val()
      let restart1 = gameSnap.child("p1/restart")
      let restart2 = gameSnap.child("p2/restart")
      if (restart1.exists() && restart2.exists()) {
        // restarts made
        database.ref('game/p1/choice').remove()
        database.ref('game/p2/choice').remove()
        database.ref('game/p1/restart').remove()
        database.ref('game/p2/restart').remove()
        self.reset()
      } else if (gameSnap.child("p" + self.player + "/restart").exists()) {
        // User restart is made is added
        messages.displayMsg('Waiting for the other player to restart..')
      } else if (!restart1.exists() && !restart2.exists()) {
        messages.displayChoiceMsg()
        let rounds = 1
        if (gameSnap.child("p1/wins").exists()) {
          rounds += gameData.p1.wins
        }
        if (gameSnap.child("p2/wins").exists()) {
          rounds += gameData.p2.wins
        }
        $('#roundText').text(rounds)
      }
    })
  }

  // Player 1 restart is made
  database.ref('game/p1/restart').on('value', function (snapshot) {
    self.updateAfterRestart(gameRef)
  })

  // Player 2 restart is made
  database.ref('game/p2/restart').on('value', function (snapshot) {
    self.updateAfterRestart(gameRef)
  })

  // Execute on init
  gameRef.once('value').then(function (snapshot) {
    var user = firebase.auth().currentUser

    // Check if player 1 exists
    let slot1Empty = !snapshot.child("p1").exists()
    let slot2Empty = !snapshot.child("p2").exists()
    if (slot1Empty) {
      self.player = 1
      database.ref('game/p1').set({
        user: user.uid
      });
    } else if (slot2Empty) {
      self.player = 2
      database.ref('game/p2').set({
        user: user.uid
      });
    } else {
      messages.displayRestartMsg('Sorry. Only two players can play at a time (for now)..')
    }
    // Clean up when disconnected
    database.ref('game/p' + self.player).onDisconnect().remove();

  })

  this.authenticate = function () {
    firebase.auth().signInAnonymously().catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    });
  }

  this.sendMessage = function () {
    let $msgInput = $('#msgInput')
    let text = $msgInput.val().trim()
    if (text) {
      // Store to firebase
      var user = firebase.auth().currentUser
      database.ref('messages').push({
        text: text,
        user: user.uid,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      })
    }
    $msgInput.val('')
  }

  // This function allows you to update your page in real-time when the firebase database changes.
  var child_added_first = true;
  database.ref('messages').orderByChild('timestamp').limitToLast(1).on('child_added', function (snapshot) {
    if (!child_added_first) {
      var user = firebase.auth().currentUser
      let msgData = snapshot.val()
      var timeStamp = moment(msgData.timestamp).format('h:mm:ss A')
      let p = $('<p>').text(msgData.text)
      let chatTime = $('<span>')
        .addClass('chat-time')
        .text(timeStamp)
      let msgType = $('<div>')
        .append(p, chatTime)
      if (msgData.user == user.uid) {
        msgType.addClass('outgoing px-0 offset-sm-5 col-sm-7')
      } else {
        msgType.addClass('incoming px-0 col-sm-7')
      }
      let chatMsg = $('<div>')
        .addClass('chat-message row')
        .append(msgType)
      let chatMessages = $('#chatMessages')
        .append(chatMsg)
      chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }
    child_added_first = false;
  })

  $('#minChat').on('click', function () {
    let $chatBody = $('#chatBody')
    $chatBody.toggle()
    if ($chatBody.is(':visible')) {
      $('#msgInput').focus()
    }
  })

  $('#msgInput').on('keyup', function (e) {
    // If enter clicked
    if (e.keyCode == 13) {
      self.sendMessage()
    }
  });

  $('#msgBtn').on('click', function () {
    self.sendMessage()
  })

  $('.choice-btn').on('click', function () {
    let choice = $(this).attr('data-choice')
    database.ref('game/p' + self.player).update({
      choice: choice
    });
    self.choiceToImg('#img1', choice)
  })

  $(document.body).on('click', '.restart-btn', function () {
    database.ref('game/p' + self.player).update({
      restart: true
    });
  })

}