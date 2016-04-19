class Commit < ActiveRecord::Base
  belongs_to :branch, inverse_of: :commits
end
