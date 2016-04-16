class Branch < ActiveRecord::Base
  belongs_to :project
  has_one :workspace
  has_many :commits

  after_create :create_initial_commit
  after_create :create_workspace

  private

  def create_initial_commit
    commits.create(name: "Initial commit")
  end
end
