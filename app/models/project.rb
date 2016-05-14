class Project < ActiveRecord::Base
  has_many :members
  has_many :users, through: :members
  has_many :branches, inverse_of: :project
  has_many :commits

  validates_presence_of :name

  mount_uploader :image, ImageUploader
  validates_processing_of :image
  validate :image_size_validation

  scope :not_private, -> (){ where(private: false) }

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
    members.first.user if members.first.role.is_author?
  end

  def commits_count
    branches.inject(0) {|x, v| x + v.commits.count }
  end

  def master_branch
    branches.first
  end

  def last_branch
    # TODO: implement has_many commits in project and belongs_to project in commits
    Commits.where(branch: self.branches).last
  end

  def find_members(user)
    members.with_user(user)
  end

  private
  def image_size_validation
    errors[:image] << "should be less than 500KB" if image.size > 0.5.megabytes
  end
end
