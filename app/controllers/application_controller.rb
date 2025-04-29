class ApplicationController < ActionController::Base
  before_action :authenticate_user!
  
  def after_sign_in_path_for(resource)
    dashboards_index_path
  end
  
  # Ensure compatibility with Turbo in Rails 7.2
  def respond_to_turbo_stream(&block)
    respond_to do |format|
      format.turbo_stream(&block)
      format.html { redirect_back fallback_location: root_path }
    end
  end
  
  # Add support for Turbo Stream requests to Devise
  def respond_to_on_destroy
    respond_to do |format|
      format.turbo_stream do
        redirect_to new_user_session_path, notice: "Signed out successfully."
      end
      format.html { redirect_to new_user_session_path, notice: "Signed out successfully." }
      format.json { head :no_content }
    end
  end
end