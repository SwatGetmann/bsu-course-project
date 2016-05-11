class Commit < ActiveRecord::Base
  has_and_belongs_to_many :branches
  belongs_to :author, class_name: "User"
  belongs_to :project, inverse_of: :commits

  scope :between, lambda {|start_time, end_time|
    {:conditions => ["? < starts_at < ?", Commit.format_date(start_time), Commit.format_date(end_time)] }
  }

  def as_json(options = {})
    {
      :id => self.id,
      :name => self.name,
      :created_at => created_at.rfc822,
      :updated_at => updated_at.rfc822,
      :url => Rails.application.routes.url_helpers.commit_path(id),
    }

  end

  def self.format_date(date_time)
    Time.at(date_time.to_i).to_formatted_s(:db)
  end
end
