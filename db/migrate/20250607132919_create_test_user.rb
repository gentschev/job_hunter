class CreateTestUser < ActiveRecord::Migration[7.2]
  def up
    # Create a test user for development
    User.create!(
      email: 'test@example.com',
      password: 'password',
      password_confirmation: 'password'
    )
  end
  
  def down
    # Remove the test user
    User.find_by(email: 'test@example.com')&.destroy
  end
end
