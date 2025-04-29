class JobTitlePreference < ApplicationRecord
  belongs_to :search_preference
  
  validates :title, presence: true
  validates :priority, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
end