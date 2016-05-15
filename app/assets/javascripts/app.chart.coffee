class App.Chart
  constructor: (@el) ->
    # initialization
    @myName = 'Swat Getmann'

  render: =>
    alert @myName
    # do smth

$(document).on "page:change", ->
  return unless $(".users.show").length > 0
  chart = new App.Chart $('#chart')
  chart.render()
