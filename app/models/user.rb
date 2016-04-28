class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  has_many :members
  has_many :projects, through: :members

  has_many :branch_members
  has_many :branches, through: :branch_members

  has_many :commits, class_name: "Commit", foreign_key: :author_id
end
