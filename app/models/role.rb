class Role < ActiveRecord::Base
  belongs_to :member

  def is_author?
    slug == 'Author'
  end
end
