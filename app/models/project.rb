class Project < ActiveRecord::Base
  has_many :members
  has_many :users, through: :members
  has_many :branches, inverse_of: :project

  after_create :create_branch

  validates_presence_of :name

  def create_author(user)
    members.create(user: user)
    members.first.create_role
  end

  def create_branch
    branches.create(name: "Master")
  end

  def author
    members.first if members.first.role.is_author?
  end

  def commits_count
    branches.inject(0) {|x, v| x + v.commits.count }
  end

  def master_branch
    branches[0]
  end
end
