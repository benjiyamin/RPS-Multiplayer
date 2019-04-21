function Messages() {
  this.displayLookingMsg = function () {
    $('#waiting').hide()
    $('#choice').hide()
    $('#win').hide()
    $('#lose').hide()
    $('#looking').show()
  }

  this.displayChoiceMsg = function () {
    $('#waiting').hide()
    $('#win').hide()
    $('#lose').hide()
    $('#looking').hide()
    $('#choice').show()
  }

  this.displayWaitingMsg = function () {
    $('#looking').hide()
    $('#choice').hide()
    $('#win').hide()
    $('#lose').hide()
    $('#waiting').show()
  }

  this.displayWinMsg = function () {
    $('#looking').hide()
    $('#choice').hide()
    $('#waiting').hide()
    $('#lose').hide()
    $('#win').show()
  }

  this.displayLoseMsg = function () {
    $('#looking').hide()
    $('#choice').hide()
    $('#waiting').hide()
    $('#win').hide()
    $('#lose').show()
  }
}