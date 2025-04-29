module Api
  module V1
    class LocationPreferencesController < BaseController
      before_action :authenticate_request
      before_action :set_location_preference, only: [:update, :destroy]
      
      def create
        @preference = current_user.search_preference.location_preferences.build(location_preference_params)
        
        if @preference.save
          render json: @preference, status: :created
        else
          render json: { errors: @preference.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      def update
        if @preference.update(location_preference_params)
          render json: @preference, status: :ok
        else
          render json: { errors: @preference.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      def destroy
        @preference.destroy
        head :no_content
      end
      
      private
      
      def set_location_preference
        @preference = current_user.search_preference.location_preferences.find(params[:id])
      end
      
      def location_preference_params
        params.require(:location_preference).permit(:city, :state, :country, :priority)
      end
    end
  end
end