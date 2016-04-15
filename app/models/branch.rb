class Branch < ActiveRecord::Base
  belongs_to :project
  belongs_to :workspace
  has_many :commits
end
