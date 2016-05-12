$(document).ready ->
  user_id = $('#calendar').data('userId')
  $('#calendar').fullCalendar
    header:
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay'
    defaultView: 'month',
    height: 500,
    slotMinutes: 30,

    events: {
     url: Routes.user_commits_path(user_id)
    }

    # eventDrop: (commit, dayDelta, minuteDelta, allDay, revertFunc) ->
    #   updateCommit(event);

    # eventResize: (commit, dayDelta, minuteDelta, revertFunc) ->
    #   updateCommit(event);


updateCommit = (the_commit) ->
  $.update "/commits/" + the_commit.id,
    event:
      name: the_event.name,
      created_at: "" + the_event.created_at,
      updated_at: "" + the_event.updated_at,
