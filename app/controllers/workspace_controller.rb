class WorkspaceController < ApplicationController
  def show
    @project = Project.find(params[:id])
    @branches = @project.branches
    @workspace = @project.master_branch.workspace
    # TODO: load history + blobls + screen elements after implementing it in DB
  end

  def demo_show
  end
end
