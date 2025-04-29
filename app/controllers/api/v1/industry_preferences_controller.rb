module Api
  module V1
    class IndustryPreferencesController < BaseController
      before_action :authenticate_request
      before_action :set_industry_preference, only: [:update, :destroy]
      
      def create
        @preference = current_user.search_preference.industry_preferences.build(industry_preference_params)
        
        if @preference.save
          render json: @preference, status: :created
        else
          render json: { errors: @preference.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      def update
        if @preference.update(industry_preference_params)
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
      
      def set_industry_preference
        @preference = current_user.search_preference.industry_preferences.find(params[:id])
      end
      
      def industry_preference_params
        params.require(:industry_preference).permit(:industry, :is_blacklisted, :priority)
      end
    end
  end
end