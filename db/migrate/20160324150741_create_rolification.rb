class CreateRolification < ActiveRecord::Migration
  def change
    create_table :rolifications do |t|
      t.belongs_to :user, index: true
      t.belongs_to :project, index: true
      t.string :role_slug
    end
  end
end
