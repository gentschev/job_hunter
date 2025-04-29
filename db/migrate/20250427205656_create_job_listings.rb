class CreateJobListings < ActiveRecord::Migration[7.2]
  def change
    create_table :job_listings do |t|
      t.string :external_id
      t.string :title
      t.string :company
      t.string :location
      t.text :description
      t.string :industry
      t.string :experience_required
      t.text :required_skills
      t.string :salary_information
      t.string :url
      t.datetime :posted_date
      t.datetime :scraped_date
      t.integer :status
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
