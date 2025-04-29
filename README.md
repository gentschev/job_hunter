Job Search Automation Application Spec
Overview
The application will consist of two main components:

A Chrome extension that handles LinkedIn interaction (searching and scraping)
A Ruby on Rails web application for managing preferences, storing data, and displaying results

Functional Requirements
Core Features

User can define multiple search parameters:

Job titles (multiple)
Cities of interest (multiple)
Industry priority list
Industry blacklist


Automated daily searching on LinkedIn (with manual trigger option)
Filtering of results based on user preferences
Notifications or dashboard view of filtered results
Storage of job listings for later review
Status tracking for applications (e.g., interested, applied, rejected)

Chrome Extension

Authenticate with LinkedIn
Execute searches based on user-defined parameters
Scrape job listings from search results
Extract key data points from each listing:

Job title
Company
Location
Industry
Description
Experience requirements
Required skills
Salary information (if available)


Send scraped data to Rails backend

Rails Web Application

User account management
Search preferences configuration
Database for storing job listings
Filtering engine based on preferences
Dashboard for viewing potential matches
Notification system for new matching jobs
Application status tracking

Rails 7.2.2.1
Ruby 3.2.6
