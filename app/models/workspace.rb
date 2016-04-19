class Workspace < ActiveRecord::Base
  belongs_to :branch, inverse_of: :workspace
end
