# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160513210005) do

  create_table "branch_members", force: :cascade do |t|
    t.integer  "branch_id"
    t.integer  "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "branch_members", ["branch_id", "user_id"], name: "index_branch_members_on_branch_id_and_user_id", unique: true
  add_index "branch_members", ["branch_id"], name: "index_branch_members_on_branch_id"
  add_index "branch_members", ["user_id"], name: "index_branch_members_on_user_id"

  create_table "branches", force: :cascade do |t|
    t.string   "name"
    t.integer  "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "branches", ["project_id"], name: "index_branches_on_project_id"

  create_table "branches_commits", force: :cascade do |t|
    t.integer "branch_id"
    t.integer "commit_id"
  end

  add_index "branches_commits", ["branch_id"], name: "index_branches_commits_on_branch_id"
  add_index "branches_commits", ["commit_id"], name: "index_branches_commits_on_commit_id"

  create_table "commits", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer  "author_id"
    t.integer  "project_id"
  end

  add_index "commits", ["id", "author_id"], name: "index_commits_on_id_and_author_id", unique: true
  add_index "commits", ["id", "project_id"], name: "index_commits_on_id_and_project_id", unique: true

  create_table "members", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "members", ["project_id"], name: "index_members_on_project_id"
  add_index "members", ["user_id"], name: "index_members_on_user_id"

  create_table "projects", force: :cascade do |t|
    t.string   "name"
    t.string   "description"
    t.datetime "created_at",                  null: false
    t.datetime "updated_at",                  null: false
    t.boolean  "private",     default: false
    t.string   "image"
  end

  create_table "roles", force: :cascade do |t|
    t.integer  "member_id"
    t.string   "slug",       default: "Author"
    t.datetime "created_at",                    null: false
    t.datetime "updated_at",                    null: false
  end

  add_index "roles", ["member_id"], name: "index_roles_on_member_id"

  create_table "users", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at",                          null: false
    t.datetime "updated_at",                          null: false
    t.string   "email",                  default: "", null: false
    t.string   "encrypted_password",     default: "", null: false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          default: 0,  null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true

  create_table "workspaces", force: :cascade do |t|
    t.integer  "branch_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "workspaces", ["branch_id"], name: "index_workspaces_on_branch_id"

end
