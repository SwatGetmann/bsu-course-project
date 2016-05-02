class AddProjectIdToCommits < ActiveRecord::Migration
  def change
    add_column :commits, :project_id, :integer
    add_index :commits, [:id, :project_id], :unique => true
  end
end
