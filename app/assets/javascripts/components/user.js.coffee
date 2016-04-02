@User = React.createClass
  render: ->
    React.DOM.tr null, [
      React.DOM.td null,
        React.DOM.a {href: "/users/#{ @props.user.id }"},  @props.user.name
      React.DOM.td null, @props.user.email
    ]