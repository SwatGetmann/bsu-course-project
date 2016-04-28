class Commit < ActiveRecord::Base
  belongs_to :branch, inverse_of: :commits
  belongs_to :author, class_name: "User"
end
