import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["checkbox"]
  
  connect() {
    this.csrfToken = document.querySelector('meta[name="csrf-token"]').content
  }
  
  toggle(event) {
    const autoSearchEnabled = event.target.checked
    
    fetch('/search_preferences', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken
      },
      body: JSON.stringify({
        search_preference: {
          auto_search_enabled: autoSearchEnabled
        }
      })
    })
    .then(response => {
      if (response.ok) {
        this.showNotification(`Automatic searches ${autoSearchEnabled ? 'enabled' : 'disabled'}`)
      } else {
        throw new Error('Failed to update setting')
      }
    })
    .catch(error => {
      console.error(error)
      event.target.checked = !autoSearchEnabled
      this.showNotification('Failed to update setting', true)
    })
  }
  
  showNotification(message, isError = false) {
    const notification = document.createElement('div')
    notification.className = `fixed bottom-4 right-4 ${isError ? 'bg-red-500' : 'bg-green-500'} text-white px-6 py-3 rounded shadow-lg transition-opacity duration-300`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.classList.add('opacity-0')
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 3000)
  }
}