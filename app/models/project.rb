class Project < ActiveRecord::Base
  has_many :members
  has_many :users, through: :members
  has_many :branches, inverse_of: :project

  validates_presence_of :name

  def add_author(user)
    members.create(user: user)
    members.first.create_role
  end

  def initialize_environment(user)
    branch = branches.new(name: "Master")
    branch.contributors << user
    branch.add_initial_commit(user)
    branch.save!
  end

  def author
    members.first if members.first.role.is_author?
  end

  def commits_count
    branches.inject(0) {|x, v| x + v.commits.count }
  end

  def master_branch
    branches.first
  end
end
