module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :verify_authenticity_token
      
      def create
        user = User.find_by(email: params[:user][:email])
        
        if user&.valid_password?(params[:user][:password])
          # Generate or retrieve authentication token
          token = user.generate_authentication_token
          
          render json: { 
            success: true, 
            token: token, 
            email: user.email 
          }
        else
          render json: { 
            success: false, 
            error: 'Invalid email or password' 
          }, status: :unauthorized
        end
      end
    end
  end
end