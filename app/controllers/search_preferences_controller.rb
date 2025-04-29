class SearchPreferencesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_search_preference, only: [:edit, :update]
  
  def edit
  end
  
  def update
    respond_to do |format|
      if @search_preference.update(search_preference_params)
        format.html { redirect_to edit_search_preference_path, notice: "Search preferences successfully updated." }
        format.json { render json: @search_preference, status: :ok }
      else
        format.html { render :edit }
        format.json { render json: { errors: @search_preference.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end
  
  private
  
  def set_search_preference
    @search_preference = current_user.search_preference || create_default_preferences
  end
  
  def create_default_preferences
    current_user.create_search_preference(auto_search_enabled: false)
  end
  
  def search_preference_params
    params.require(:search_preference).permit(
      :auto_search_enabled,
      job_title_preferences_attributes: [:id, :title, :priority, :_destroy],
      location_preferences_attributes: [:id, :city, :state, :country, :priority, :_destroy],
      industry_preferences_attributes: [:id, :industry, :is_blacklisted, :priority, :_destroy]
    )
  end
end