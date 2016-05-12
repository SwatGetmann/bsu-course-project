class WelcomeController < ApplicationController
  skip_before_action :authenticate_user!
  def index
    @last_10_projects = Project.not_private.last(10)
  end
end
