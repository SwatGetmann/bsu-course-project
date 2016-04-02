@ProjectTable = React.createClass
  getInitialState: ->
    projects: @props.data
  getDefaultProps: ->
    projects: []
  render: ->
    React.DOM.div
      className: 'projects'
      React.DOM.h2
        className: 'title'
        'Projects'
      React.DOM.table({className: 'table table-bordered'}
        React.DOM.thead null
          React.DOM.tr null, [
            React.DOM.th null, 'Name'
            React.DOM.th null, 'Description'
          ]
        React.DOM.tbody null, [
          for project in @state.projects
            React.createElement Project, key: project.id, project: project
        ]
      )

      #React.DOM.ul({}, [
      #  for project in @state.projects
      #    React.createElement Project, key: project.id, project: project
      #    # Project({key: project.id, project: project})
      #])