module ProjectHelper
  def branches_short_info (project)
    "Branches: " + project.branches.count.inspect
  end

  def commits_short_info (project)
    "Commits: " + project.commits_count.inspect
  end
end
