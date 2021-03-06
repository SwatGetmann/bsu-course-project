class ProjectsController < ApplicationController
  before_action :preload_project, only: [:show, :edit, :update, :destroy]
  before_action :check_membership, only: [:show, :edit]

  def index
    @projects = Project.all
  end

  def show
  end

  def edit
  end

  def create
    @project = Project.create(project_params)
    @project.add_author(current_user)
    @project.initialize_environment(current_user)
    respond_to do |format|
      if @project.save
        format.html { redirect_to @project, notice: 'Project was successfully created.' }
        format.json { render :show, status: :created, location: @project }
      else
        format.html { render :new }
        format.json { render json: @project.errors, status: :unprocessable_entity }
      end
    end
  end

  def new
    @project = Project.new
  end

  def update
    respond_to do |format|
      if @project.update(project_params)
        format.html { redirect_to @project, notice: 'Project was successfully updated.' }
        format.json { render :show, status: :ok, location: @project }
      else
        format.html { render :edit }
        format.json { render json: @project.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @project.destroy
    respond_to do |format|
      format.html { redirect_to current_user, notice: 'Project was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  def project_params
    params.require(:project).permit(:name, :description, :private, :image, :remove_image)
  end

  def check_membership
    if @project.private? && current_user.projects.exclude?(@project)
      flash[:error] = "You cannot view this project, because it is private"
      redirect_to :back # halts request cycle
    end
  end

  def preload_project
    @project = Project.find(params[:id])
  end
end
