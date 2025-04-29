import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["list", "template", "form", "industry", "isBlacklisted", "priority", "priorityField", "errors"]
  
  connect() {
    this.csrfToken = document.querySelector('meta[name="csrf-token"]').content
  }
  
  add(event) {
    event.preventDefault()
    
    // Get form values
    const industry = this.industryTarget.value.trim()
    const isBlacklisted = this.isBlacklistedTarget.checked
    const priority = isBlacklisted ? null : this.priorityTarget.value
    
    // Validate inputs
    if (!this.validateInputs(industry, isBlacklisted, priority)) return
    
    // Create preference via API
    this.createPreference(industry, isBlacklisted, priority)
  }
  
  edit(event) {
    event.preventDefault()
    const item = event.currentTarget.closest('[data-preference-id]')
    const id = item.dataset.preferenceId
    const industryInput = item.querySelector('[data-field="industry"]')
    const isBlacklistedInput = item.querySelector('[data-field="is_blacklisted"]')
    const priorityInput = item.querySelector('[data-field="priority"]')
    
    const industry = industryInput.value.trim()
    const isBlacklisted = isBlacklistedInput.checked
    const priority = isBlacklisted ? null : priorityInput.value
    
    if (!this.validateInputs(industry, isBlacklisted, priority)) return
    
    this.updatePreference(id, industry, isBlacklisted, priority, item)
  }
  
  remove(event) {
    event.preventDefault()
    if (!confirm("Are you sure you want to remove this industry preference?")) return
    
    const item = event.currentTarget.closest('[data-preference-id]')
    const id = item.dataset.preferenceId
    
    this.deletePreference(id, item)
  }
  
  validateInputs(industry, isBlacklisted, priority) {
    let errors = []
    
    if (!industry) errors.push("Industry cannot be blank")
    if (!isBlacklisted && (!priority || isNaN(parseInt(priority)) || parseInt(priority) < 1)) {
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
  
  createPreference(industry, isBlacklisted, priority) {
    fetch('/api/v1/industry_preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken
      },
      body: JSON.stringify({
        industry_preference: {
          industry: industry,
          is_blacklisted: isBlacklisted,
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
      this.showNotification('Industry preference added successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  updatePreference(id, industry, isBlacklisted, priority, item) {
    fetch(`/api/v1/industry_preferences/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken
      },
      body: JSON.stringify({
        industry_preference: {
          industry: industry,
          is_blacklisted: isBlacklisted,
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
      item.querySelector('[data-display="industry"]').textContent = data.industry
      
      // Update blacklist status display
      const blacklistIcon = item.querySelector('[data-display="blacklist-icon"]')
      const priorityDisplay = item.querySelector('[data-display="priority"]')
      
      if (data.is_blacklisted) {
        blacklistIcon.classList.remove('hidden')
        priorityDisplay.textContent = 'Blacklisted'
      } else {
        blacklistIcon.classList.add('hidden')
        priorityDisplay.textContent = data.priority
      }
      
      // Toggle display mode
      item.querySelector('.view-mode').classList.remove('hidden')
      item.querySelector('.edit-mode').classList.add('hidden')
      
      this.showNotification('Industry preference updated successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  deletePreference(id, item) {
    fetch(`/api/v1/industry_preferences/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': this.csrfToken
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete industry preference')
      }
      
      // Remove the item from the list with animation
      item.classList.add('opacity-0')
      setTimeout(() => {
        item.remove()
      }, 300)
      
      this.showNotification('Industry preference removed successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  addItemToList(data) {
    const template = this.templateTarget.innerHTML
    let newItem = template
      .replace(/NEW_ID/g, data.id)
      .replace(/NEW_INDUSTRY/g, data.industry)
    
    if (data.is_blacklisted) {
      newItem = newItem
        .replace(/NEW_BLACKLISTED_HIDDEN/g, '')
        .replace(/NEW_PRIORITY_TEXT/g, 'Blacklisted')
    } else {
      newItem = newItem
        .replace(/NEW_BLACKLISTED_HIDDEN/g, 'hidden')
        .replace(/NEW_PRIORITY_TEXT/g, data.priority)
    }
    
    this.listTarget.insertAdjacentHTML('beforeend', newItem)
    
    // Animate the new item
    const addedItem = this.listTarget.lastElementChild
    addedItem.classList.add('bg-green-50')
    setTimeout(() => {
      addedItem.classList.remove('bg-green-50')
    }, 1000)
  }
  
  resetForm() {
    this.industryTarget.value = ''
    this.isBlacklistedTarget.checked = false
    this.priorityTarget.value = '1'
    this.togglePriorityField({ target: this.isBlacklistedTarget })
    this.industryTarget.focus()
  }
  
  togglePriorityField(event) {
    const isBlacklisted = event.target.checked
    
    if (this.hasPriorityFieldTarget) {
      if (isBlacklisted) {
        this.priorityFieldTarget.classList.add('hidden')
      } else {
        this.priorityFieldTarget.classList.remove('hidden')
      }
    }
  }
  
  toggleItemPriorityField(event) {
    const isBlacklisted = event.target.checked
    const item = event.target.closest('[data-preference-id]')
    const priorityField = item.querySelector('[data-edit-field="priority"]')
    
    if (isBlacklisted) {
      priorityField.classList.add('hidden')
    } else {
      priorityField.classList.remove('hidden')
    }
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
    
    // If switching to edit mode, focus on the industry input
    if (!editMode.classList.contains('hidden')) {
      editMode.querySelector('[data-field="industry"]').focus()
      
      // Apply correct visibility to priority field
      const isBlacklisted = editMode.querySelector('[data-field="is_blacklisted"]').checked
      const priorityField = editMode.querySelector('[data-edit-field="priority"]')
      
      if (isBlacklisted) {
        priorityField.classList.add('hidden')
      } else {
        priorityField.classList.remove('hidden')
      }
    }
  }
  
  cancelEdit(event) {
    event.preventDefault()
    const item = event.currentTarget.closest('[data-preference-id]')
    
    // Reset form values to original
    const industryInput = item.querySelector('[data-field="industry"]')
    const isBlacklistedInput = item.querySelector('[data-field="is_blacklisted"]')
    const priorityInput = item.querySelector('[data-field="priority"]')
    
    const industryDisplay = item.querySelector('[data-display="industry"]')
    const blacklistIcon = item.querySelector('[data-display="blacklist-icon"]')
    const priorityDisplay = item.querySelector('[data-display="priority"]')
    
    industryInput.value = industryDisplay.textContent
    isBlacklistedInput.checked = !blacklistIcon.classList.contains('hidden')
    
    if (!isBlacklistedInput.checked) {
      priorityInput.value = priorityDisplay.textContent
    } else {
      priorityInput.value = '1'
    }
    
    // Update priority field visibility
    this.toggleItemPriorityField({ target: isBlacklistedInput })
    
    // Toggle back to view mode
    item.querySelector('.view-mode').classList.remove('hidden')
    item.querySelector('.edit-mode').classList.add('hidden')
  }
}