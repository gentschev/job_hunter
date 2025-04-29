require "test_helper"

class SearchPreferencesControllerTest < ActionDispatch::IntegrationTest
  test "should get edit" do
    get search_preferences_edit_url
    assert_response :success
  end

  test "should get update" do
    get search_preferences_update_url
    assert_response :success
  end
end
