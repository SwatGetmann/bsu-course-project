module ProjectHelper
  ROLE_UNSET = 'Unset'

  def branches_short_info (project)
    "Branches: " + project.branches.count.inspect
  end

  def commits_short_info (project)
    "Commits: " + project.commits_count.inspect
  end

  def current_user_role (project)
    members_scope = project.find_members(current_user)
    if members_scope.any?
      members_scope.first.role.slug
    else
      ROLE_UNSET
    end
  end
end
