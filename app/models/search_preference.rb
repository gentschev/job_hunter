class SearchPreference < ApplicationRecord
  belongs_to :user
  has_many :job_title_preferences, dependent: :destroy
  has_many :location_preferences, dependent: :destroy
  has_many :industry_preferences, dependent: :destroy
  
  accepts_nested_attributes_for :job_title_preferences, allow_destroy: true, reject_if: :all_blank
  accepts_nested_attributes_for :location_preferences, allow_destroy: true, reject_if: :all_blank
  accepts_nested_attributes_for :industry_preferences, allow_destroy: true, reject_if: :all_blank
end