class Commit < ActiveRecord::Base
  has_and_belongs_to_many :branches
  belongs_to :author, class_name: "User"
  belongs_to :project, inverse_of: :commits

  scope :between, -> (start_time, end_time){
    where(created_at: start_time.to_date.beginning_of_day..end_time.to_date.end_of_day)
  }

  def as_json(options = {})
    {
      :title => self.name,
      :start => created_at.to_date.iso8601
    }
  end
end
