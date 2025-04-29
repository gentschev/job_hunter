class CreateSearchPreferences < ActiveRecord::Migration[7.2]
  def change
    create_table :search_preferences do |t|
      t.references :user, null: false, foreign_key: true
      t.boolean :auto_search_enabled

      t.timestamps
    end
  end
end
