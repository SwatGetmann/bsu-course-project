class CreateBranchesCommitsTable < ActiveRecord::Migration
  def change
    create_table :branches_commits do |t|
      t.belongs_to :branch, index: true
      t.belongs_to :commit, index: true
    end

    remove_column :commits, :branch_id
  end
end
