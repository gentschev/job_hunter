module ApplicationHelper
  def status_color(status)
    case status.to_s
    when 'new_listing'
      'bg-blue-100 text-blue-800'
    when 'interested'
      'bg-green-100 text-green-800'
    when 'applied'
      'bg-purple-100 text-purple-800'
    when 'interviewing'
      'bg-yellow-100 text-yellow-800'
    when 'rejected'
      'bg-red-100 text-red-800'
    when 'offer'
      'bg-indigo-100 text-indigo-800'
    when 'accepted'
      'bg-teal-100 text-teal-800'
    when 'declined'
      'bg-gray-100 text-gray-800'
    else
      'bg-gray-100 text-gray-800'
    end
  end
  
  def status_display_name(status)
    if status.to_s == 'new_listing'
      'New'
    else
      status.to_s.capitalize
    end
  end
end
