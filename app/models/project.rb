class Project < ActiveRecord::Base
  has_many :rolifications
  has_many :users, through: :rolifications
end
