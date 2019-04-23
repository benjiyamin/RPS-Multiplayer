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
    $img.closest('.flip-container').addClass('flipped')
    let src = 'assets/images/question-mark.png'
    if (choice === 'fire') {
      src = 'assets/images/fire.png'
    } else if (choice === 'water') {
      src = 'assets/images/water.png'
    } else if (choice === 'leaf') {
      src = 'assets/images/leaf.png'
    }
    $img.attr('src', src)
  }

  this.reveal = function (choice2) {
    this.choiceToImg('#img2', choice2)
  }

  this.reset = function () {
    this.choiceToImg('#img1')
    this.choiceToImg('#img2')
    $('.flip-container').removeClass('flipped')
  }

  this.result = function (userChoice, opponentChoice) {
    if (userChoice === opponentChoice) {
      return 'tie'
    } else if (userChoice === 'leaf' && opponentChoice == 'water') {
      return 'win'
    } else if (userChoice === 'fire' && opponentChoice == 'leaf') {
      return 'win'
    } else if (userChoice === 'water' && opponentChoice == 'fire') {
      return 'win'
    } else {
      return 'lose'
    }
  }

  let gameRef = database.ref('game')

  // Whenever a player is added
  gameRef.on('child_added', function (snapshot) {
    gameRef.once('value').then(function (gameSnap) {
      //if (gameSnap.child("p1").exists() && gameSnap.child("p2").exists()) {
      if (gameSnap.child("p" + self.opponent()).exists()) {
        // Opponent is added
        messages.displayChoiceMsg()
      } else {
        // User is added
        messages.displayMsg('Looking for an opponent to play against..')
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
        let userChoice, opponentChoice
        if (self.player === 1 && choice1.exists() && choice2.exists()) {
          userChoice = gameData.p1.choice
          opponentChoice = gameData.p2.choice
        } else if (self.player === 2 && choice1.exists() && choice2.exists()) {
          userChoice = gameData.p2.choice
          opponentChoice = gameData.p1.choice
        }
        if (self.result(userChoice, opponentChoice) === 'win') {
          messages.displayRestartMsg('Nice! You won this round. ')
        } else if (self.result(userChoice, opponentChoice) === 'lose') {
          messages.displayRestartMsg('Sorry, you lose this round. ')
        } else if (self.result(userChoice, opponentChoice) === 'tie') {
          messages.displayRestartMsg('Looks like a tie. ')
        }
        self.reveal(opponentChoice)
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
    }
    //console.log('Player: ' + self.player)
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