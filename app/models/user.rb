class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
         
  has_one :search_preference, dependent: :destroy
  has_many :job_listings, dependent: :destroy
  
  after_create :create_default_search_preference
  
  # Authentication token for API access
  def generate_authentication_token
    loop do
      token = SecureRandom.hex(24)
      if !User.exists?(authentication_token: token)
        update(authentication_token: token)
        return token
      end
    end
  end
  
  private
  
  def create_default_search_preference
    # Using create! in Rails 7.2 to ensure visibility of validation errors
    SearchPreference.create!(user: self, auto_search_enabled: false)
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("Failed to create default search preference: #{e.message}")
  end
end