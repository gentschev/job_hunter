// Configure your import map in config/importmap.rb
console.log("Loading application.js")

// Basic Rails dependencies
import "@hotwired/turbo-rails" 

import * as ActiveStorage from "@rails/activestorage"
ActiveStorage.start()

import "controllers"

console.log("JS booted with Stimulus")
