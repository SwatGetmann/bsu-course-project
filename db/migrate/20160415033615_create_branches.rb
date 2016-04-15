class CreateBranches < ActiveRecord::Migration
  def change
    create_table :branches do |t|
      t.string :name
      t.integer :workspace_id
      t.integer :project_id
      t.timestamps null: false
    end

    add_index :branches, :workspace_id
    add_index :branches, :project_id
  end
end
