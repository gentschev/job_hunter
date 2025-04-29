import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="nested-form"
export default class extends Controller {
  static targets = ["template", "container"]

  connect() {
    // Automatically set up handlers for existing is_blacklisted checkboxes
    this.element.querySelectorAll('input[type=checkbox][name*=is_blacklisted]').forEach(checkbox => {
      this.togglePriority({ target: checkbox });
    });
  }

  add(event) {
    event.preventDefault();
    
    const type = event.params.type;
    const template = this.templateTarget;
    const content = template.innerHTML.replace(/NEW_RECORD/g, new Date().getTime());
    
    this.containerTarget.insertAdjacentHTML('beforeend', content);
  }
  
  remove(event) {
    event.preventDefault();
    
    const item = event.target.closest('.nested-fields');
    
    // Check if we should mark for destruction instead of removing
    const destroyField = item.querySelector('input[name*="_destroy"]');
    if (destroyField) {
      // Just hide the item and mark as destroyed
      item.style.display = 'none';
      destroyField.value = 1;
    } else {
      // Remove from DOM if there's no _destroy field
      item.remove();
    }
  }
  
  togglePriority(event) {
    const isBlacklisted = event.target.checked;
    const item = event.target.closest('.nested-fields');
    const priorityField = item.querySelector('[id$="_priority"]').closest('div');
    
    if (isBlacklisted) {
      priorityField.classList.add('hidden');
    } else {
      priorityField.classList.remove('hidden');
    }
  }
}
