## ADDED Requirements

### Requirement: Admin can list all users
The system SHALL display a paginated list of all users when the admin accesses the users page.

#### Scenario: Users list displays successfully
- **WHEN** authenticated admin user navigates to `/users`
- **THEN** system displays table of users with columns: ID, Name, Email, Role, Status, Created Date, Actions
- **AND** role badges show: "admin" (purple), "user" (gray)
- **AND** status badges show: "active" (green), "inactive" (red)
- **AND** table is paginated with 20 users per page
- **AND** role dropdown allows filtering by role
- **AND** status dropdown allows filtering by status
- **AND** search input allows filtering by name or email

#### Scenario: Filter users by role
- **WHEN** admin user selects "admin" from role dropdown
- **THEN** system filters users list to show only admin users

#### Scenario: Filter users by status
- **WHEN** admin user selects "active" from status dropdown
- **THEN** system filters users list to show only active users

### Requirement: Admin can view user details
The system SHALL display detailed information about a user including their order history.

#### Scenario: View user details
- **WHEN** admin user clicks on a user in the list
- **THEN** system navigates to `/users/{id}`
- **AND** displays user information: Name, Email, Role, Status, Created Date
- **AND** shows action buttons: "Edit Role", "Deactivate/Activate"
- **AND** displays user's order history with order count
- **AND** shows last login date (if available)

#### Scenario: User details with order history
- **WHEN** admin user views a user with orders
- **THEN** system displays table of user's recent orders
- **AND** each order shows: Order ID, Status, Total Amount, Date
- **AND** provides link to view order details

#### Scenario: User details with no orders
- **WHEN** admin user views a user with no orders
- **THEN** system displays "No orders yet" message

### Requirement: Admin can update user role
The system SHALL allow admin users to change a user's role between admin and user.

#### Scenario: Promote user to admin
- **WHEN** admin user clicks "Edit Role" on a regular user
- **THEN** system displays role selection dropdown
- **WHEN** admin user selects "admin" and saves
- **THEN** system updates user role via API
- **AND** displays success toast "User role updated to admin"
- **AND** user appears with admin badge in list

#### Scenario: Demote admin to user
- **WHEN** admin user clicks "Edit Role" on another admin user
- **THEN** system displays role selection dropdown
- **WHEN** admin user selects "user" and saves
- **THEN** system displays confirmation dialog "Are you sure you want to remove admin privileges from this user?"
- **WHEN** admin user confirms
- **THEN** system updates user role to user
- **AND** displays success toast "User role updated to user"

#### Scenario: Cannot remove own admin role
- **WHEN** admin user attempts to remove their own admin role
- **THEN** system displays error "You cannot remove your own admin privileges"
- **AND** does not update role

### Requirement: Admin can deactivate user
The system SHALL allow admin users to deactivate a user account, preventing login.

#### Scenario: Deactivate user account
- **WHEN** admin user clicks "Deactivate" on an active user
- **THEN** system displays confirmation dialog "Are you sure you want to deactivate this user? They will not be able to log in."
- **WHEN** admin user confirms
- **THEN** system deactivates user account via API
- **AND** displays success toast "User account deactivated"
- **AND** user status changes to "inactive"
- **AND** user cannot log in

#### Scenario: Activate user account
- **WHEN** admin user clicks "Activate" on an inactive user
- **THEN** system displays confirmation dialog "Are you sure you want to activate this user?"
- **WHEN** admin user confirms
- **THEN** system activates user account
- **AND** displays success toast "User account activated"
- **AND** user status changes to "active"
- **AND** user can log in again

#### Scenario: Cannot deactivate own account
- **WHEN** admin user attempts to deactivate their own account
- **THEN** system displays error "You cannot deactivate your own account"
- **AND** does not deactivate

### Requirement: Admin can search users
The system SHALL provide search functionality for finding users by name or email.

#### Scenario: Search users by name
- **WHEN** admin user types "John" in search input
- **THEN** system filters users to show only users with "John" in their name

#### Scenario: Search users by email
- **WHEN** admin user types "john@example.com" in search input
- **THEN** system filters users to show the user with that email

#### Scenario: Search with partial email
- **WHEN** admin user types "@example.com" in search input
- **THEN** system filters users to show all users with that email domain

#### Scenario: Search with no results
- **WHEN** admin user searches with no matching results
- **THEN** system displays "No users found matching your search"
