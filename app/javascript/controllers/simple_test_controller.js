import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["output"]
  
  connect() {
    console.log("Simple test controller connected!")
    
    // Set initial content to ensure the controller is connecting
    if (this.hasOutputTarget) {
      this.outputTarget.textContent = "Controller connected!"
    }
  }
  
  hello() {
    console.log("Hello method called!")
    
    if (this.hasOutputTarget) {
      this.outputTarget.textContent = "Hello from Stimulus!"
    } else {
      console.error("No output target found")
    }
  }
}