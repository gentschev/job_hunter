# Pin npm packages by running ./bin/importmap

pin "application", preload: true
pin "@rails/request.js", to: "@rails--request.js.js" # @0.0.12
pin "@rails/activestorage", to: "activestorage.esm.js", preload: true

pin "@hotwired/turbo-rails", to: "turbo.min.js", preload: true
pin "@hotwired/stimulus",          to: "stimulus.js",          preload: true
pin "@hotwired/stimulus-loading",  to: "stimulus-loading.js",  preload: true

pin_all_from "app/javascript/controllers", under: "controllers"
