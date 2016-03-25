class WorkspaceController < ApplicationController
  def show
    @project = Project.find(params[:id])
    # TODO: load history + blobls + screen elements after implementing it in DB
  end
end
