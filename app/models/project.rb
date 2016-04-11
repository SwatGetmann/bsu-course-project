class Project < ActiveRecord::Base
  has_many :rolifications
  has_many :users, through: :rolifications

  has_many :members
  has_many :users, through: :members

  def create_author_rolification(user, role)
    self.rolifications.create(user: user, role_slug: role)
  end
end
