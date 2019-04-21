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

  // Whenever a change to the database occues
  database.ref("game").on("value", function (snapshot) {

    var user = firebase.auth().currentUser

    // Check if player 1 exists
    let slot1Empty = !snapshot.child("p1").exists()
    let slot2Empty = !snapshot.child("p2").exists()
    if (!self.player && slot1Empty) {
      self.player = 1
      database.ref('game/p1').set({
        user: user.uid
      });
    } else if (!self.player && slot2Empty) {
      self.player = 2
      database.ref('game/p2').set({
        user: user.uid
      });
    }
    // Clean up when disconnected
    database.ref('game/p' + self.player).onDisconnect().remove();

    let choice1 = snapshot.child("p1/choice")
    let choice2 = snapshot.child("p2/choice")

    let gameData = snapshot.val()
    if (choice1.exists() && choice2.exists()) {
      let choice
      if (self.player === 1) {
        choice = gameData.p2.choice
      } else if (self.player === 2) {
        choice = gameData.p1.choice
      }
      self.reveal(choice)
    } else {
      self.reset()
    }

    let userChoice, opponentChoice
    if (self.player === 1 && choice1.exists() && choice2.exists()) {
      userChoice = gameData.p1.choice
      opponentChoice = gameData.p2.choice
    } else if (self.player === 2 && choice1.exists() && choice2.exists()) {
      userChoice = gameData.p2.choice
      opponentChoice = gameData.p1.choice
    }
    //if ((self.player === 1 && slot2Empty) || (self.player === 2 && slot1Empty)) {
    if ((self.player === 1 && slot2Empty) || (self.player === 2 && slot1Empty)) {
      //messages.displayLookingMsg()
      messages.displayMsg('Looking for an opponent to play against..')
    } else if ((self.player === 1 && !choice1.exists()) || (self.player === 2 && !choice2.exists())) {
      messages.displayChoiceMsg()
    } else if ((self.player === 1 && !choice2.exists()) || (self.player === 2 && !choice1.exists())) {
      //messages.displayWaitingMsg()
      messages.displayMsg('Waiting for the other player to make choice..')
    } else if (self.result(userChoice, opponentChoice) === 'win') {
      //messages.displayWinMsg()
      messages.displayRestartMsg('Nice! You won this round. ')
    } else if (self.result(userChoice, opponentChoice) === 'lose') {
      //messages.displayLoseMsg()
      messages.displayRestartMsg('Sorry, you lose this round. ')
    } else if (self.result(userChoice, opponentChoice) === 'tie') {
      //messages.displayTieMsg()
      messages.displayRestartMsg('Looks like a tie. ')
    }

    // Determine if a win occured
    /*
    if (self.result(userChoice, opponentChoice) === 'win') {
      if (self.player === 1) {
        // player 1
        wins = 1
        if (snapshot.child("p1/wins").exists()) {
          wins = gameData.p1.wins
        }
        database.ref('game/p1').update({
          wins: wins
        });
      } else if (self.player === 2) {
        // player 2
        wins = 1
        if (snapshot.child("p2/wins").exists()) {
          wins = gameData.p2.wins
        }
        database.ref('game/p2').update({
          wins: wins
        });
      }
    }
    */

    // restart the game
    let restart1 = snapshot.child("p1/restart")
    let restart2 = snapshot.child("p2/restart")
    if (restart1.exists() && restart2.exists() && gameData.p1.restart === true && gameData.p2.restart) {
      database.ref('game/p1/choice').remove()
      database.ref('game/p2/choice').remove()
      database.ref('game/p1/restart').remove()
      database.ref('game/p2/restart').remove()
    }

  })

  this.init = function () {
    firebase.auth().signInAnonymously().catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    });
  }

  $('.choice-btn').on('click', function () {
    let choice = $(this).attr('data-choice')
    if (self.player === 1) {
      // player 1
      database.ref('game/p1').update({
        choice: choice
      });
    } else if (self.player === 2) {
      // player 2
      database.ref('game/p2').update({
        choice: choice
      });
    }
    self.choiceToImg('#img1', choice)
  })

  $(document.body).on('click', '.start-btn', function () {
    database.ref('game/p' + self.player).update({
      restart: true
    });
  })

}