module Api
  module V1
    class SearchPreferencesController < BaseController
      before_action :authenticate_request
      
      def index
        search_preference = current_user.search_preference
        
        render json: {
          auto_search_enabled: search_preference.auto_search_enabled,
          job_title_preferences: search_preference.job_title_preferences,
          location_preferences: search_preference.location_preferences,
          industry_preferences: search_preference.industry_preferences
        }
      end
    end
  end
end