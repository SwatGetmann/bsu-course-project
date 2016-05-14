class Member < ActiveRecord::Base
  belongs_to :user
  belongs_to :project
  has_one :role, dependent: :destroy

  scope :with_user, -> (user){
    where(user_id: user.id)
  }
end
