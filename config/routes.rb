Rails.application.routes.draw do
  # Web UI routes
  root "dashboards#index"
  
  get "dashboards/index"
  
  resources :job_listings, only: [:index, :show, :update]
  
  # Search preferences routes with custom paths
  get "/search_preferences/edit", to: "search_preferences#edit", as: "edit_search_preference"
  patch "/search_preferences", to: "search_preferences#update", as: "search_preference"
  
  # Authentication
  devise_for :users
  
  # API endpoints for Chrome extension
  namespace :api do
    namespace :v1 do
      # Authentication
      post "/users/sign_in", to: "auth#create"
      
      # Search preferences
      resources :search_preferences, only: [:index]
      resources :job_title_preferences, only: [:create, :update, :destroy]
      resources :location_preferences, only: [:create, :update, :destroy]
      resources :industry_preferences, only: [:create, :update, :destroy]
      
      # Job listings
      resources :job_listings, only: [:index, :show, :create]
      post "/job_listings/batch", to: "job_listings#batch_create"
    end
  end
end
