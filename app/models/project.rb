class Project < ActiveRecord::Base
  has_many :members
  has_many :users, through: :members

  def create_author(user)
    members.create(user: user)
    members.first.create_role
  end

  def author
    members.first if members.first.role.is_author?
  end
end
