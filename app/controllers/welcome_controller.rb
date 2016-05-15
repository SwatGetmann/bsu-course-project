class WelcomeController < ApplicationController
  skip_before_action :authenticate_user!
  def index
    @last_four_projects = Project.not_private.last(4)
  end
end
