class DashboardsController < ApplicationController
  def index
    @job_listings = current_user.job_listings.recent.limit(20)
  end
end