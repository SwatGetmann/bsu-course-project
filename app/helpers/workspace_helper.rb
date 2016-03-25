module WorkspaceHelper
  def role(user, project)
    Rolification.find_by(project: project, user: user).role_slug
  end
end
