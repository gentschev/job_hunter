module Api
  module V1
    class BaseController < ActionController::API
      # JWT authentication setup with improved security for Rails 7.2
      
      private
      
      def authenticate_request
        header = request.headers['Authorization']
        token = header.split(' ').last if header
        
        begin
          # Updated to use the newer JWT patterns with algorithm verification
          decoded = JWT.decode(
            token, 
            Rails.application.credentials.secret_key_base, 
            true, 
            { 
              algorithm: 'HS256', 
              verify_jti: true,
              verify_iat: true,
              verify_expiration: true
            }
          )
          @current_user = User.find(decoded[0]['user_id'])
        rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError => e
          # Improved error logging and security
          Rails.logger.warn("JWT authentication failed: #{e.class} - #{e.message}")
          render json: { error: 'Authentication failed' }, status: :unauthorized
        rescue ActiveRecord::RecordNotFound
          Rails.logger.warn("JWT referenced non-existent user")
          render json: { error: 'Authentication failed' }, status: :unauthorized
        end
      end
      
      def current_user
        @current_user
      end
    end
  end
end