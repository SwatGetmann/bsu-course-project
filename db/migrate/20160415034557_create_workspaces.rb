class CreateWorkspaces < ActiveRecord::Migration
  def change
    create_table :workspaces do |t|
      t.integer :branch_id
      t.timestamps null: false
    end

    add_index :workspaces, :branch_id
  end
end
