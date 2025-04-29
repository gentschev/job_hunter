import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["list", "template", "form", "title", "priority", "errors"]
  
  connect() {
    console.log("JobTitlePreference controller connected")
    console.log("Targets found:", 
      this.hasListTarget ? "list ✓" : "list ✗",
      this.hasTemplateTarget ? "template ✓" : "template ✗",
      this.hasTitleTarget ? "title ✓" : "title ✗",
      this.hasPriorityTarget ? "priority ✓" : "priority ✗"
    )
    this.csrfToken = document.querySelector('meta[name="csrf-token"]').content
  }
  
  add(event) {
    console.log("Add method called")
    event.preventDefault()
    
    try {
      // Get form values
      console.log("Title target:", this.titleTarget)
      console.log("Priority target:", this.priorityTarget)
      
      const title = this.titleTarget.value.trim()
      const priority = this.priorityTarget.value
      
      console.log("Form values:", { title, priority })
      
      // Validate inputs
      if (!this.validateInputs(title, priority)) return
      
      // Create preference via API
      this.createPreference(title, priority)
    } catch (error) {
      console.error("Error in add method:", error)
    }
  }
  
  edit(event) {
    event.preventDefault()
    const item = event.currentTarget.closest('[data-preference-id]')
    const id = item.dataset.preferenceId
    const titleInput = item.querySelector('[data-field="title"]')
    const priorityInput = item.querySelector('[data-field="priority"]')
    
    const title = titleInput.value.trim()
    const priority = priorityInput.value
    
    if (!this.validateInputs(title, priority)) return
    
    this.updatePreference(id, title, priority, item)
  }
  
  remove(event) {
    event.preventDefault()
    if (!confirm("Are you sure you want to remove this job title preference?")) return
    
    const item = event.currentTarget.closest('[data-preference-id]')
    const id = item.dataset.preferenceId
    
    this.deletePreference(id, item)
  }
  
  validateInputs(title, priority) {
    let errors = []
    
    if (!title) errors.push("Title cannot be blank")
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
  
  createPreference(title, priority) {
    fetch('/api/v1/job_title_preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken
      },
      body: JSON.stringify({
        job_title_preference: {
          title: title,
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
      this.showNotification('Job title preference added successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  updatePreference(id, title, priority, item) {
    fetch(`/api/v1/job_title_preferences/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken
      },
      body: JSON.stringify({
        job_title_preference: {
          title: title,
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
      item.querySelector('[data-display="title"]').textContent = data.title
      item.querySelector('[data-display="priority"]').textContent = data.priority
      
      // Toggle display mode
      item.querySelector('.view-mode').classList.remove('hidden')
      item.querySelector('.edit-mode').classList.add('hidden')
      
      this.showNotification('Job title preference updated successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  deletePreference(id, item) {
    fetch(`/api/v1/job_title_preferences/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': this.csrfToken
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete job title preference')
      }
      
      // Remove the item from the list with animation
      item.classList.add('opacity-0')
      setTimeout(() => {
        item.remove()
      }, 300)
      
      this.showNotification('Job title preference removed successfully')
    })
    .catch(error => {
      this.showErrors([error.message])
    })
  }
  
  addItemToList(data) {
    const template = this.templateTarget.innerHTML
    const newItem = template
      .replace(/NEW_ID/g, data.id)
      .replace(/NEW_TITLE/g, data.title)
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
    this.titleTarget.value = ''
    this.priorityTarget.value = '1'
    this.titleTarget.focus()
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
    
    // If switching to edit mode, focus on the title input
    if (!editMode.classList.contains('hidden')) {
      editMode.querySelector('[data-field="title"]').focus()
    }
  }
  
  cancelEdit(event) {
    event.preventDefault()
    const item = event.currentTarget.closest('[data-preference-id]')
    
    // Reset form values to original
    const titleInput = item.querySelector('[data-field="title"]')
    const priorityInput = item.querySelector('[data-field="priority"]')
    const titleDisplay = item.querySelector('[data-display="title"]')
    const priorityDisplay = item.querySelector('[data-display="priority"]')
    
    titleInput.value = titleDisplay.textContent
    priorityInput.value = priorityDisplay.textContent
    
    // Toggle back to view mode
    item.querySelector('.view-mode').classList.remove('hidden')
    item.querySelector('.edit-mode').classList.add('hidden')
  }
}