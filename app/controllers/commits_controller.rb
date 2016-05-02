class CommitsController < ApplicationController
  before_action :preload_branch_and_project, only: [:new, :create]

  def new
    @commit = Commit.new()
  end

  def create
    @commit = @branch.commits.create(commit_params)
    respond_to do |format|
      if @commit.save
        format.html { redirect_to @project, notice: 'Branch was successfully created.' }
        format.json { render :show, status: :created, location: @commit }
      else
        format.html { render :new }
        format.json { render json: @commit.errors, status: :unprocessable_entity }
      end
    end
  end

  def show
    @commit = Commit.find(params[:id])
  end

  def copy
    # to be implemented
  end

  private

  def commit_params
    params.require(:new_commit).permit(:name).merge(author: current_user, project: @project)
  end

  def preload_branch_and_project
    @branch = Branch.find(params[:branch_id])
    @project = @branch.project
  end
end
