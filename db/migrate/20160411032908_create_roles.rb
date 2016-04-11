class CreateRoles < ActiveRecord::Migration
  def change
    create_table :roles do |t|
      t.belongs_to :member, index: true
      t.string :slug, default: "Author"
      t.timestamps null: false
    end
  end
end
