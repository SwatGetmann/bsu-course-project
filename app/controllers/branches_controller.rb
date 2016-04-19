class BranchesController < ApplicationController
  before_action :preload_project, only: [:new, :create]

  def new
    @project = Project.find(params[:project_id])
    @branch = Branch.new(project: @project)
  end

  def create
    @branch = @project.branches.create(branch_params)
    respond_to do |format|
      if @branch.save
        format.html { redirect_to :back, notice: 'Branch was successfully created.' }
        format.json { render :show, status: :created, location: @branch }
      else
        format.html { render :new }
        format.json { render json: @branch.errors, status: :unprocessable_entity }
      end
    end
  end

  private

  def branch_params
    params.require(:branch).permit(:name)
  end

  def preload_project
    @project = Project.find(params[:project_id])
  end
end
