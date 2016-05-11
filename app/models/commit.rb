class Commit < ActiveRecord::Base
  has_and_belongs_to_many :branches
  belongs_to :author, class_name: "User"
  belongs_to :project, inverse_of: :commits
end
