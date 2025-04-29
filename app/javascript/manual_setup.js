// Manual Stimulus setup
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOMContentLoaded - setting up manual handlers");
  
  // Manual implementation of the simple-test controller
  const testContainers = document.querySelectorAll('[data-controller="simple-test"]');
  testContainers.forEach(container => {
    console.log("Found simple-test container", container);
    
    const outputElement = container.querySelector('[data-simple-test-target="output"]');
    if (outputElement) {
      outputElement.textContent = "Manual controller initialized!";
      
      const button = container.querySelector('button[data-action="click->simple-test#hello"]');
      if (button) {
        button.addEventListener("click", function() {
          console.log("Manual hello method called!");
          outputElement.textContent = "Hello from manual controller!";
        });
      }
    }
  });
  
  // Job Title Preferences
  setupPreferenceHandlers("job-title-preference");
  
  // Location Preferences
  setupPreferenceHandlers("location-preference");
  
  // Industry Preferences
  setupPreferenceHandlers("industry-preference");
  
  function setupPreferenceHandlers(controllerName) {
    const containers = document.querySelectorAll(`[data-controller="${controllerName}"]`);
    containers.forEach(container => {
      console.log(`Found ${controllerName} container`, container);
      
      // Add button event handler
      const addButton = container.querySelector(`[data-action^="click->${controllerName}#add"]`);
      if (addButton) {
        addButton.addEventListener("click", function(e) {
          e.preventDefault();
          console.log(`Manual ${controllerName} add button clicked`);
          
          // Get references to the form inputs
          const titleInput = container.querySelector(`[data-${controllerName}-target="title"]`);
          const priorityInput = container.querySelector(`[data-${controllerName}-target="priority"]`);
          
          if (titleInput && priorityInput) {
            alert(`Would add: ${titleInput.value} with priority ${priorityInput.value}`);
            titleInput.value = "";
            priorityInput.value = "1";
          } else {
            console.error("Could not find form inputs");
          }
        });
      }
    });
  }
});