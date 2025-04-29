class CreateLocationPreferences < ActiveRecord::Migration[7.2]
  def change
    create_table :location_preferences do |t|
      t.references :search_preference, null: false, foreign_key: true
      t.string :city
      t.string :state
      t.string :country
      t.integer :priority

      t.timestamps
    end
  end
end
