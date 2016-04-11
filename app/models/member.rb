class Member < ActiveRecord::Base
  belongs_to :user
  belongs_to :project
  has_one :role, dependent: :destroy
end
