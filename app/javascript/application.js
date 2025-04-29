// Configure your import map in config/importmap.rb
console.log("Loading application.js")

// Basic Rails dependencies
import "@hotwired/turbo-rails" 
import "@rails/activestorage"

// Initialize ActiveStorage
ActiveStorage.start()

// Use our manual setup instead of Stimulus
import "./manual_setup"
