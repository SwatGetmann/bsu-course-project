class DropRolificationsTable < ActiveRecord::Migration
  def change
    drop_table :rolifications
  end
end
