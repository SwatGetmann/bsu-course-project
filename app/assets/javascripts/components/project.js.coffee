@Project = React.createClass
  render: ->
    React.DOM.tr null, [
      React.DOM.td null,
        React.DOM.a {href: "/projects/#{ @props.project.id }"},  @props.project.name
      React.DOM.td null, @props.project.description
    ]