class AddAuthorToCommit < ActiveRecord::Migration
  def change
    add_column :commits, :author_id, :integer
    add_index :commits, [:id, :author_id], :unique => true
  end
end
