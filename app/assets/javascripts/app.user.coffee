App.User =
  setRole: ->
    alert "SET ROLE <lambda>"
    # do some stuff

$(document).on "click", "[data-behavior~=set-role]", =>
  debugger
  App.User.setRole()
