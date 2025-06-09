class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
         
  has_one :search_preference, dependent: :destroy
  has_many :job_listings, dependent: :destroy
  
  after_create :create_default_search_preference
  
  # Generate JWT token for API access
  def generate_authentication_token
    payload = {
      user_id: self.id,
      email: self.email,
      iat: Time.current.to_i,
      exp: 24.hours.from_now.to_i,
      jti: SecureRandom.uuid
    }
    
    JWT.encode(
      payload,
      Rails.application.credentials.secret_key_base,
      'HS256'
    )
  end
  
  private
  
  def create_default_search_preference
    # Using create! in Rails 7.2 to ensure visibility of validation errors
    SearchPreference.create!(user: self, auto_search_enabled: false)
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("Failed to create default search preference: #{e.message}")
  end
end