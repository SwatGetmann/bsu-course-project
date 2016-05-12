(function() {
  var updateCommit;

  $(document).ready(function() {
    return $('#calendar').fullCalendar({
      editable: true,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      defaultView: 'month',
      height: 500,
      slotMinutes: 30,
      eventSources: [
        {
          url: '/commits'
        }
      ],
      timeFormat: 'h:mm t{ - h:mm t} ',
      dragOpacity: "0.5",
      eventDrop: function(commit, dayDelta, minuteDelta, allDay, revertFunc) {
        return updateCommit(event);
      },
      eventResize: function(commit, dayDelta, minuteDelta, revertFunc) {
        return updateCommit(event);
      }
    });
  });

  updateCommit = function(the_commit) {
    return $.update("/commits/" + the_commit.id, {
      event: {
        name: the_event.name,
        created_at: "" + the_event.created_at,
        updated_at: "" + the_event.updated_at
      }
    });
  };

}).call(this);
