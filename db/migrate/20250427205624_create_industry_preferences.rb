class CreateIndustryPreferences < ActiveRecord::Migration[7.2]
  def change
    create_table :industry_preferences do |t|
      t.references :search_preference, null: false, foreign_key: true
      t.string :industry
      t.boolean :is_blacklisted
      t.integer :priority

      t.timestamps
    end
  end
end
