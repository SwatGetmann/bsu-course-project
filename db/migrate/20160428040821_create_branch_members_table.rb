class CreateBranchMembersTable < ActiveRecord::Migration
  def change
    create_table :branch_members do |t|
      t.references :branch
      t.references :user

      t.timestamps null: false
    end

    add_index :branch_members, [:branch_id, :user_id], :unique => true
    add_index :branch_members, :branch_id
    add_index :branch_members, :user_id
  end
end
