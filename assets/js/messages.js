function Messages() {

  this.displayMsg = function (msg) {
    $('#choice').hide()
    $('#message')
      .text(msg)
      .show()
  }

  this.displayRestartMsg = function (msg) {
    $('#choice').hide()
    let a = $('<a>')
      .attr('href', '#')
      .addClass('start-btn')
      .text('Play again.')
    $('#message')
      .text(msg)
      .append(a)
      .show()
  }

  this.displayChoiceMsg = function () {
    $('#message').hide()
    $('#choice').show()
  }
  
}