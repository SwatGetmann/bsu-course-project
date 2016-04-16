class Branch < ActiveRecord::Base
  belongs_to :project, inverse_of: :branches
  has_one :workspace, inverse_of: :branch
  has_many :commits, inverse_of: :branch

  after_create :create_initial_commit
  after_create :create_workspace

  private

  def create_initial_commit
    commits.create(name: "Initial commit")
  end
end
