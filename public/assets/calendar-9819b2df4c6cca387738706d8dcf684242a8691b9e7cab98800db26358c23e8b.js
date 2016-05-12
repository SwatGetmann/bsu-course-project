(function() {
  var updateCommit;

  $(document).ready(function() {
    var user_id;
    user_id = $('#calendar').data('userId');
    return $('#calendar').fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      defaultView: 'month',
      height: 500,
      slotMinutes: 30,
      events: {
        url: Routes.user_commits_path(user_id)
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
