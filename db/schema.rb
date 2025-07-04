# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_06_07_132919) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "industry_preferences", force: :cascade do |t|
    t.bigint "search_preference_id", null: false
    t.string "industry"
    t.boolean "is_blacklisted"
    t.integer "priority"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["search_preference_id"], name: "index_industry_preferences_on_search_preference_id"
  end

  create_table "job_listings", force: :cascade do |t|
    t.string "external_id"
    t.string "title"
    t.string "company"
    t.string "location"
    t.text "description"
    t.string "industry"
    t.string "experience_required"
    t.text "required_skills"
    t.string "salary_information"
    t.string "url"
    t.datetime "posted_date"
    t.datetime "scraped_date"
    t.integer "status"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_job_listings_on_user_id"
  end

  create_table "job_title_preferences", force: :cascade do |t|
    t.bigint "search_preference_id", null: false
    t.string "title"
    t.integer "priority"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["search_preference_id"], name: "index_job_title_preferences_on_search_preference_id"
  end

  create_table "location_preferences", force: :cascade do |t|
    t.bigint "search_preference_id", null: false
    t.string "city"
    t.string "state"
    t.string "country"
    t.integer "priority"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["search_preference_id"], name: "index_location_preferences_on_search_preference_id"
  end

  create_table "search_preferences", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.boolean "auto_search_enabled"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_search_preferences_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "authentication_token"
    t.index ["authentication_token"], name: "index_users_on_authentication_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "industry_preferences", "search_preferences"
  add_foreign_key "job_listings", "users"
  add_foreign_key "job_title_preferences", "search_preferences"
  add_foreign_key "location_preferences", "search_preferences"
  add_foreign_key "search_preferences", "users"
end
