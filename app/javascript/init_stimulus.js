import { Application } from "@hotwired/stimulus"
import SimpleTestController from "./controllers/simple_test_controller"

// Start Stimulus application
const application = Application.start()

// Register controllers manually
application.register("simple-test", SimpleTestController)

console.log("Stimulus initialized with SimpleTestController")