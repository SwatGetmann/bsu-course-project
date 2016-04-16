class CreateBranches < ActiveRecord::Migration
  def change
    create_table :branches do |t|
      t.string :name
      t.integer :project_id
      t.timestamps null: false
    end

    add_index :branches, :project_id
  end
end
