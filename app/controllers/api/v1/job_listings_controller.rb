module Api
  module V1
    class JobListingsController < BaseController
      before_action :authenticate_request
      
      # GET /api/v1/job_listings
      def index
        @job_listings = current_user.job_listings.recent
        
        render json: @job_listings
      end
      
      # GET /api/v1/job_listings/:id
      def show
        @job_listing = current_user.job_listings.find(params[:id])
        
        render json: @job_listing
      end
      
      # POST /api/v1/job_listings
      def create
        @job_listing = current_user.job_listings.new(job_listing_params)
        
        if @job_listing.save
          render json: @job_listing, status: :created
        else
          render json: { error: @job_listing.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end
      
      # POST /api/v1/job_listings/batch
      def batch_create
        results = { saved_count: 0, errors: [] }
        
        job_listings_params.each do |listing_params|
          listing = current_user.job_listings.new(listing_params)
          
          if listing.save
            results[:saved_count] += 1
          else
            results[:errors] << { 
              external_id: listing_params[:external_id],
              errors: listing.errors.full_messages
            }
          end
        end
        
        render json: results
      end
      
      private
      
      def job_listing_params
        params.require(:job_listing).permit(
          :external_id, :title, :company, :location, :description,
          :industry, :experience_required, :required_skills,
          :salary_information, :url, :posted_date, :status
        )
      end
      
      def job_listings_params
        params.require(:job_listings).map do |listing|
          listing.permit(
            :external_id, :title, :company, :location, :description,
            :industry, :experience_required, :required_skills,
            :salary_information, :url, :posted_date, :status
          )
        end
      end
    end
  end
end