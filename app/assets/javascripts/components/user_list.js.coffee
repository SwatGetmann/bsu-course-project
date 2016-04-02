@UserTable = React.createClass
  getInitialState: ->
    users: @props.data
  getDefaultProps: ->
    users: []
  render: ->
    React.DOM.div
      className: 'users'
      React.DOM.h2
        className: 'title'
        'Users'
      React.DOM.table({className: 'table table-bordered'}
        React.DOM.thead null
          React.DOM.tr null, [
            React.DOM.th null, 'Name'
            React.DOM.th null, 'Email'
          ]
        React.DOM.tbody null, [
          for user in @state.users
            React.createElement User, key: user.id, user: user
        ]
      )