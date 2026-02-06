## ADDED Requirements

### Requirement: Admin authentication requires admin role
The system SHALL restrict access to the admin application to users with the "admin" role only.

#### Scenario: Non-admin user denied access
- **WHEN** regular user with "user" role attempts to access any admin page
- **THEN** system redirects to admin login page with error message "Access denied. Admin privileges required."

#### Scenario: Unauthenticated user redirected to login
- **WHEN** unauthenticated user attempts to access admin page
- **THEN** system redirects to `/login` page

#### Scenario: Admin user granted access
- **WHEN** authenticated user with "admin" role accesses admin page
- **THEN** system allows access and displays admin dashboard

### Requirement: Admin can login with email and password
The system SHALL provide a login page for admin users to authenticate.

#### Scenario: Navigate to admin login
- **WHEN** admin user navigates to `/login`
- **THEN** system displays login form with email and password fields
- **AND** shows "Login" button
- **AND** displays link to customer app homepage

#### Scenario: Successful admin login
- **WHEN** admin user enters valid email `admin@bookstore.com` and password `admin123456`
- **AND** clicks "Login" button
- **THEN** system authenticates via API POST `/auth/login`
- **AND** stores access token and refresh token in admin auth store
- **AND** checks user role from token response
- **AND** if role is "admin", redirects to admin dashboard `/`
- **AND** if role is "user", displays error "Access denied. Admin privileges required."

#### Scenario: Admin login shows loading state
- **WHEN** admin user submits login form
- **AND** authentication is in progress
- **THEN** system disables login form
- **AND** displays loading spinner on "Login" button

#### Scenario: Admin login with invalid credentials
- **WHEN** admin user enters invalid email or password
- **THEN** system displays error message "Invalid email or password"
- **AND** keeps user on login page

### Requirement: Admin authentication persists across sessions
The system SHALL persist admin authentication state using localStorage and refresh tokens.

#### Scenario: Persist admin session
- **WHEN** admin user successfully logs in
- **THEN** system stores access token in admin auth store
- **AND** stores refresh token in localStorage
- **AND** persists user data (id, name, email, role) in localStorage

#### Scenario: Restore admin session on page reload
- **WHEN** admin user refreshes any admin page
- **THEN** system checks localStorage for persisted auth data
- **AND** if valid token exists, restores admin session
- **AND** displays admin dashboard without requiring re-login

#### Scenario: Expired token triggers refresh
- **WHEN** admin user makes API request with expired access token
- **THEN** system attempts to refresh using refresh token via API POST `/auth/refresh`
- **AND** if refresh successful, updates access token
- **AND** continues original request
- **AND** if refresh fails, logs out user and redirects to login

### Requirement: Admin can logout
The system SHALL provide logout functionality for admin users to end their session.

#### Scenario: Logout from admin
- **WHEN** admin user clicks "Logout" button in sidebar or header
- **THEN** system displays confirmation dialog "Are you sure you want to logout?"
- **WHEN** admin user confirms
- **THEN** system calls API POST `/auth/logout` with refresh token
- **AND** clears access token from admin auth store
- **AND** clears tokens and user data from localStorage
- **AND** redirects to `/login` page

#### Scenario: Logout handles error
- **WHEN** API call to logout fails
- **THEN** system still clears local tokens and redirects to login
- **AND** displays toast "Logged out successfully" (local logout)

### Requirement: Admin authentication is role-validated on protected routes
The system SHALL validate admin role on all protected routes using middleware or route guards.

#### Scenario: Route guard on dashboard
- **WHEN** authenticated user with "user" role attempts to access `/`
- **THEN** route guard checks user role
- **AND** denies access, redirects to login with error

#### Scenario: Route guard on books page
- **WHEN** authenticated user with "admin" role accesses `/books`
- **THEN** route guard allows access

#### Scenario: Route guard on login page
- **WHEN** already-authenticated admin user accesses `/login`
- **THEN** system redirects to dashboard `/`
- **AND** does not show login page

### Requirement: Admin authentication displays user info
The system SHALL display current admin user information in the UI.

#### Scenario: Display admin user in sidebar/header
- **WHEN** admin user is logged in
- **THEN** system displays admin user's name and email in sidebar or header
- **AND** shows admin badge indicating "admin" role
- **AND** displays logout button

#### Scenario: Display admin user in mobile view
- **WHEN** admin user views admin app on mobile
- **THEN** system displays user info in responsive header
- **AND** provides menu access to logout
