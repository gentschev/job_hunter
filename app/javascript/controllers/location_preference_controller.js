import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["list", "template", "form", "city", "state", "country", "priority", "errors"]
  
  connect() {
    this.csrfToken = document.querySelector('meta[name="csrf-token"]').content
  }
  
  add(event) {
    event.preventDefault()
    
    // Get form values
    const city = this.cityTarget.value.trim()
    const state = this.stateTarget.value.trim()
    const country = this.countryTarget.value.trim()
    const priority = this.priorityTarget.value
    
    // Validate inputs
    if (!this.validateInputs(city, state, priority)) return
    
    // Create preference via API
    this.createPreference(city, state, country, priority)
  }
  
  edit(event) {
    event.preventDefault()
    const item = event.currentTarget.closest('[data-preference-id]')
    const id = item.dataset.preferenceId
    const cityInput = item.querySelector('[data-field="city"]')
    const stateInput = item.querySelector('[data-field="state"]')
    const countryInput = item.querySelector('[data-field="country"]')
    const priorityInput = item.querySelector('[data-field="priority"]')
    
    const city = cityInput.value.trim()
    const state = stateInput.value.trim()
    const country = countryInput.value.trim()
    const priority = priorityInput.value
    
    if (!this.validateInputs(city, state, priority)) return
    
    this.updatePreference(id, city, state, country, priority, item)
  }
  
  remove(event) {
    event.preventDefault()
    if (!confirm("Are you sure you want to remove this location preference?")) return
    
    const item = event.currentTarget.closest('[data-preference-id]')
    const id = item.dataset.preferenceId
    
    this.deletePreference(id, item)
  }
  
  validateInputs(city, state, priority) {
    let errors = []
    
    if (!city) errors.push("City cannot be blank")
    if (!state) errors.push("State cannot be blank")
    if (!priority || isNaN(parseInt(priority)) || parseInt(priority) < 1) {
      errors.push("Priority must be a number greater than or equal to 1")
    }
    
    if (errors.length > 0) {
      this.showErrors(errors)
      return false
    }
    
    this.clearErrors()
    return true
  }
  
  showErrors(errors) {
    if (this.hasErrorsTarget) {
      this.errorsTarget.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <ul class="list-disc pl-5">
            ${errors.map(error => `<li>${error}</li>`).join('')}
          </ul>
        </div>
      `
    }
  }
  
  clearErrors() {
    if (this.hasErrorsTarget) {
      this.errorsTarget.innerHTML = ''
    }
  }
  
  createPreference(city, state, country, priority) {
    fetch('/api/v1/location_preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken
      },
      body: JSON.stringify({
        location_preference: {
          city: city,
          state: state,
          country: country,
          priority: priority
        }
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.errors?.join(', ') || 'An error occurred')
        })
      }
      return response.json()
    })
    .then(data => {
      this.addItemToList(data)
      this.resetForm()
      this.showNotification('Location preference added successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  updatePreference(id, city, state, country, priority, item) {
    fetch(`/api/v1/location_preferences/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken
      },
      body: JSON.stringify({
        location_preference: {
          city: city,
          state: state,
          country: country,
          priority: priority
        }
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.errors?.join(', ') || 'An error occurred')
        })
      }
      return response.json()
    })
    .then(data => {
      // Update the item in the list with the latest data
      item.querySelector('[data-display="city"]').textContent = data.city
      item.querySelector('[data-display="state"]').textContent = data.state
      item.querySelector('[data-display="country"]').textContent = data.country || ''
      item.querySelector('[data-display="priority"]').textContent = data.priority
      
      // Toggle display mode
      item.querySelector('.view-mode').classList.remove('hidden')
      item.querySelector('.edit-mode').classList.add('hidden')
      
      this.showNotification('Location preference updated successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  deletePreference(id, item) {
    fetch(`/api/v1/location_preferences/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': this.csrfToken
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete location preference')
      }
      
      // Remove the item from the list with animation
      item.classList.add('opacity-0')
      setTimeout(() => {
        item.remove()
      }, 300)
      
      this.showNotification('Location preference removed successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  addItemToList(data) {
    const template = this.templateTarget.innerHTML
    const newItem = template
      .replace(/NEW_ID/g, data.id)
      .replace(/NEW_CITY/g, data.city)
      .replace(/NEW_STATE/g, data.state)
      .replace(/NEW_COUNTRY/g, data.country || '')
      .replace(/NEW_PRIORITY/g, data.priority)
    
    this.listTarget.insertAdjacentHTML('beforeend', newItem)
    
    // Animate the new item
    const addedItem = this.listTarget.lastElementChild
    addedItem.classList.add('bg-green-50')
    setTimeout(() => {
      addedItem.classList.remove('bg-green-50')
    }, 1000)
  }
  
  resetForm() {
    this.cityTarget.value = ''
    this.stateTarget.value = ''
    this.countryTarget.value = ''
    this.priorityTarget.value = '1'
    this.cityTarget.focus()
  }
  
  showNotification(message) {
    const notification = document.createElement('div')
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg transition-opacity duration-300'
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.classList.add('opacity-0')
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 3000)
  }
  
  toggleEditMode(event) {
    event.preventDefault()
    const item = event.currentTarget.closest('[data-preference-id]')
    
    // Toggle display/edit modes
    const viewMode = item.querySelector('.view-mode')
    const editMode = item.querySelector('.edit-mode')
    
    viewMode.classList.toggle('hidden')
    editMode.classList.toggle('hidden')
    
    // If switching to edit mode, focus on the first input
    if (!editMode.classList.contains('hidden')) {
      editMode.querySelector('[data-field="city"]').focus()
    }
  }
  
  cancelEdit(event) {
    event.preventDefault()
    const item = event.currentTarget.closest('[data-preference-id]')
    
    // Reset form values to original
    const cityInput = item.querySelector('[data-field="city"]')
    const stateInput = item.querySelector('[data-field="state"]')
    const countryInput = item.querySelector('[data-field="country"]')
    const priorityInput = item.querySelector('[data-field="priority"]')
    
    const cityDisplay = item.querySelector('[data-display="city"]')
    const stateDisplay = item.querySelector('[data-display="state"]')
    const countryDisplay = item.querySelector('[data-display="country"]')
    const priorityDisplay = item.querySelector('[data-display="priority"]')
    
    cityInput.value = cityDisplay.textContent
    stateInput.value = stateDisplay.textContent
    countryInput.value = countryDisplay.textContent
    priorityInput.value = priorityDisplay.textContent
    
    // Toggle back to view mode
    item.querySelector('.view-mode').classList.remove('hidden')
    item.querySelector('.edit-mode').classList.add('hidden')
  }
}