module Api
  module V1
    class JobTitlePreferencesController < BaseController
      before_action :authenticate_request
      before_action :set_job_title_preference, only: [:update, :destroy]
      
      def create
        @preference = current_user.search_preference.job_title_preferences.build(job_title_preference_params)
        
        if @preference.save
          render json: @preference, status: :created
        else
          render json: { errors: @preference.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      def update
        if @preference.update(job_title_preference_params)
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
      
      def set_job_title_preference
        @preference = current_user.search_preference.job_title_preferences.find(params[:id])
      end
      
      def job_title_preference_params
        params.require(:job_title_preference).permit(:title, :priority)
      end
    end
  end
end