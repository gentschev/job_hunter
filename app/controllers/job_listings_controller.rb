class JobListingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_job_listing, only: [:show, :update]
  
  def index
    @job_listings = current_user.job_listings.recent
    @job_listings = @job_listings.by_status(params[:status]) if params[:status].present?
  end
  
  def show
  end
  
  def update
    if @job_listing.update(job_listing_params)
      redirect_to @job_listing, notice: 'Job listing status was successfully updated.'
    else
      render :show
    end
  end
  
  private
  
  def set_job_listing
    @job_listing = current_user.job_listings.find(params[:id])
  end
  
  def job_listing_params
    params.require(:job_listing).permit(:status)
  end
end