module WorkspaceHelper
  def role(user, project)
    project_members_scope = project.members.where(user: user)
    unless project_members_scope.empty?
      project_members_scope.first.role.slug
    else
      "No role on this project / workspace found for current user"
    end
  end
end
