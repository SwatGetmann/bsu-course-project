module UsersHelper
  def private_project_name(project)
    project.name + " (private) "
  end
end
