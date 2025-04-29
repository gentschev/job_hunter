class CreateJobTitlePreferences < ActiveRecord::Migration[7.2]
  def change
    create_table :job_title_preferences do |t|
      t.references :search_preference, null: false, foreign_key: true
      t.string :title
      t.integer :priority

      t.timestamps
    end
  end
end
