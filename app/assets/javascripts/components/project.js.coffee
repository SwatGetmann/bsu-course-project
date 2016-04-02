@Project = React.createClass
  render: ->
    React.DOM.tr null, [
      React.DOM.td null, @props.project.name
      React.DOM.td null, @props.project.description
    ]

    #React.DOM.li({}, @props.project.name)
    # React.DOM.p className: "project description", @props.project.description
    # React.DOM.div className: "project name", @props.project.name
