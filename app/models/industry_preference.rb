class IndustryPreference < ApplicationRecord
  belongs_to :search_preference
  
  validates :industry, presence: true
  validates :priority, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, if: -> { !is_blacklisted }
  
  before_save :clear_priority_if_blacklisted
  
  private
  
  def clear_priority_if_blacklisted
    self.priority = nil if is_blacklisted
  end
end