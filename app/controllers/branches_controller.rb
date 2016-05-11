class BranchesController < ApplicationController
  before_action :preload, only: [:show]

  def new
    @project = Project.find(params[:project_id])
    @branch = Branch.new(project: @project)
  end

  def create
    @project = Project.find(params[:project_id])
    @branch = @project.branches.create(branch_params)
    @branch.add_initial_commit(current_user)
    respond_to do |format|
      if @branch.save
        format.html { redirect_to @project, notice: 'Branch was successfully created.' }
        format.json { render :show, status: :created, location: @branch }
      else
        format.html { render :new }
        format.json { render json: @branch.errors, status: :unprocessable_entity }
      end
    end
  end

  def show
  end

  def copy_first_step
    @origin_branch = Branch.find(params[:id])
    @project = @origin_branch.project
    @branch = Branch.new
  end

  def copy_process
    @origin_branch = Branch.find(params[:id])
    @project = @origin_branch.project

    @branch = Branch.new(branch_params.merge(project: @project))
    @branch.commit_ids = @origin_branch.commit_ids
    respond_to do |format|
      if @project.branches << @branch
        format.html { redirect_to @project, notice: 'Branch was successfully copied.' }
        format.json { render :show, status: :created, location: @branch }
      else
        format.html { render :copy_first_step }
        format.json { render json: @branch.errors, status: :unprocessable_entity }
      end
    end
  end

  private

  def branch_params
    params.require(:branch).permit(:name)
  end

  def preload
    @branch = Branch.find(params[:id])
    @project = @branch.project || Project.find(params[:project_id])
  end
end
