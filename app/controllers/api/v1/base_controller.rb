module Api
  module V1
    # Inherit from full-stack controller so Devise session helpers work
    class BaseController < ApplicationController
      # JSON requests from fetch don’t include the CSRF token; skip the check
      skip_before_action :verify_authenticity_token
      # Skip Devise authentication for API endpoints - we use JWT instead  
      skip_before_action :authenticate_user!

      private

      def authenticate_request
        # If the user already has a Devise session cookie, trust it
        if user_signed_in?
          @current_user = current_user
          return
        end

        # Otherwise fall back to JWT header auth
        header = request.headers['Authorization']
        token  = header.split(' ').last if header.present?

        begin
          decoded = JWT.decode(
            token,
            Rails.application.credentials.secret_key_base,
            true,
            algorithm: 'HS256',
            verify_jti: true,
            verify_iat: true,
            verify_expiration: true
          )
          @current_user = User.find(decoded[0]['user_id'])
        rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError
          render json: { error: 'Authentication failed' }, status: :unauthorized
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Authentication failed' }, status: :unauthorized
        end
      end
    end
  end
end
