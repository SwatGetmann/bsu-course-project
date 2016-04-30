class CommitsController < ApplicationController
  # before_action :preload_branch_and_project, only: [:copy, :show]

  def new
    @branch = Branch.find(params[:branch_id])
    @commit = Commit.new(branch: @branch)
    @project = @branch.project
  end

  def create
    @branch = Branch.find(params[:branch_id])
    @commit = @branch.commits.create(commit_params)
    @commit.author = current_user
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
    @branch = @commit.branch
  end

  def copy
    # to be implemented
  end

  private

  def commit_params
    params.require(:commit).permit(:name)
  end

  # def preload_branch_and_project
  #   @branch = Branch.find(params[:branch_id])
  #   @project = @branch.project
  # end
end
