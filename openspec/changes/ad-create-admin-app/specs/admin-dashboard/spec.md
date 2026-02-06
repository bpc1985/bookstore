## ADDED Requirements

### Requirement: Admin dashboard displays key metrics
The system SHALL display a dashboard with key metrics including total books, total authors, total categories, and total users when the admin accesses the dashboard page.

#### Scenario: Dashboard loads successfully
- **WHEN** authenticated admin user navigates to `/`
- **THEN** system displays four stat cards showing total books, authors, categories, and users
- **AND** each stat card shows a label, value, and icon
- **AND** values are fetched from `/admin/analytics` API endpoint

#### Scenario: Dashboard shows loading state
- **WHEN** dashboard is loading metrics
- **THEN** system displays skeleton loading placeholders for all stat cards

#### Scenario: Dashboard handles API errors
- **WHEN** API call to `/admin/analytics` fails
- **THEN** system displays an error message
- **AND** shows toast notification indicating failed to load dashboard data

### Requirement: Admin dashboard displays books per category chart
The system SHALL display a pie chart showing the distribution of books across categories on the dashboard.

#### Scenario: Books per category chart displays
- **WHEN** admin user views dashboard
- **THEN** system displays a pie chart with each category as a slice
- **AND** each slice shows category name and book count
- **AND** chart is responsive and adapts to screen size
- **AND** hovering over slice shows tooltip with details

#### Scenario: Chart handles empty data
- **WHEN** there are no books or categories
- **THEN** system displays empty state message "No books data available"

### Requirement: Admin dashboard displays recently added books chart
The system SHALL display a line chart showing books added over the last 30 days on the dashboard.

#### Scenario: Recently added books chart displays
- **WHEN** admin user views dashboard
- **THEN** system displays a line chart with dates on x-axis and book count on y-axis
- **AND** chart covers the last 30 days
- **AND** line connects data points showing trend
- **AND** hovering over point shows tooltip with date and count

#### Scenario: Chart handles insufficient data
- **WHEN** there are fewer than 7 days of book data
- **THEN** system displays chart with available data points
- **AND** chart x-axis adjusts to show available date range

### Requirement: Admin dashboard displays user growth chart
The system SHALL display a line chart showing user growth over the last 6 months on the dashboard.

#### Scenario: User growth chart displays
- **WHEN** admin user views dashboard
- **THEN** system displays a line chart with months on x-axis and cumulative user count on y-axis
- **AND** chart covers the last 6 months
- **AND** line shows growth trend over time
- **AND** hovering over point shows tooltip with month and user count

#### Scenario: User growth chart displays for new store
- **WHEN** store has fewer than 6 months of data
- **THEN** system displays chart with available monthly data
- **AND** chart x-axis adjusts to show available months

### Requirement: Dashboard widgets provide quick navigation
The system SHALL provide interactive widgets that allow admins to quickly navigate to relevant management pages.

#### Scenario: Stat cards are clickable
- **WHEN** admin user clicks on "Total Books" stat card
- **THEN** system navigates to `/books` page
- **WHEN** admin user clicks on "Total Categories" stat card
- **THEN** system navigates to `/categories` page
- **WHEN** admin user clicks on "Total Users" stat card
- **THEN** system navigates to `/users` page

#### Scenario: Charts are interactive
- **WHEN** admin user clicks on a category in the books per category chart
- **THEN** system navigates to `/books` page filtered by that category
