class Branch < ActiveRecord::Base
  belongs_to :project, inverse_of: :branches
  has_one :workspace, inverse_of: :branch
  has_many :commits, inverse_of: :branch

  has_many :branch_members
  has_many :contributors, through: :branch_members, source: :user

  # after_create :create_initial_commit
  after_create :create_workspace

  def add_initial_commit(user)
    commit = commits.new(name: "Initial commit", author: user)
    commit.save!
  end

  def last_commit
    self.commits.last
  end
end
