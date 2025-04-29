class JobListing < ApplicationRecord
  belongs_to :user
  
  # Status enum
  enum :status, {
    new_listing: 0,
    interested: 1,
    applied: 2,
    interviewing: 3,
    rejected: 4,
    offer: 5,
    accepted: 6,
    declined: 7
  }
  
  validates :external_id, presence: true, uniqueness: { scope: :user_id }
  validates :title, :company, :location, :url, presence: true
  
  scope :recent, -> { order(scraped_date: :desc) }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  
  # Method to filter job listings based on user preferences
  def self.filter_by_preferences(user)
    # This is a placeholder for the actual filtering logic
    # We'll implement more sophisticated filtering in a later phase
    where(user: user)
  end
end