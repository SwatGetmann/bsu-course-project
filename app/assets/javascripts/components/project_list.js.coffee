@ProjectTable = React.createClass
  getInitialState: ->
    projects: @props.data
    title: @props.title
  getDefaultProps: ->
    projects: []
  render: ->
    React.DOM.div
      className: 'projects'
      React.DOM.h2
        className: 'title'
        @state.title
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