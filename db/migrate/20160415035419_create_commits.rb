class CreateCommits < ActiveRecord::Migration
  def change
    create_table :commits do |t|
      t.string :name
      t.integer :branch_id
      t.timestamps null: false
    end

    add_index :commits, :branch_id
  end
end
