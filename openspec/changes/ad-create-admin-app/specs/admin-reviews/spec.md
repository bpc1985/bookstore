## ADDED Requirements

### Requirement: Admin can list pending reviews
The system SHALL display a paginated list of pending reviews when the admin accesses the reviews page.

#### Scenario: Pending reviews list displays
- **WHEN** authenticated admin user navigates to `/reviews`
- **THEN** system displays table of reviews with columns: ID, Book Title, User, Rating, Comment, Date, Actions
- **AND** only shows reviews with "pending" status
- **AND** table is paginated with 20 reviews per page
- **AND** rating shows star display (e.g., ★★★★☆)
- **AND** comment shows truncated preview (max 100 characters)

#### Scenario: Pending reviews list handles empty state
- **WHEN** there are no pending reviews
- **THEN** system displays empty state message "No pending reviews to moderate"
- **AND** shows message "All reviews have been reviewed"

### Requirement: Admin can view review details
The system SHALL display full details of a review including book information and reviewer details.

#### Scenario: View review details
- **WHEN** admin user clicks on a review
- **THEN** system displays modal or navigates to review detail
- **AND** shows full review: Book Title and Author, User Name and Email, Rating (stars), Full Comment, Created Date
- **AND** displays action buttons: "Approve", "Reject"
- **AND** shows book information: Cover image, price, stock

### Requirement: Admin can approve review
The system SHALL allow admin users to approve pending reviews, making them visible to customers.

#### Scenario: Approve review successfully
- **WHEN** admin user clicks "Approve" on a pending review
- **THEN** system calls API PUT `/admin/reviews/{id}/approve?approved=true`
- **AND** displays success toast "Review approved"
- **AND** removes review from pending reviews list
- **AND** review becomes visible on book page for customers

#### Scenario: Approve review with confirmation
- **WHEN** admin user clicks "Approve"
- **THEN** system displays confirmation dialog "Approve this review?"
- **WHEN** admin user confirms
- **THEN** system approves review

#### Scenario: Approve review handles error
- **WHEN** API returns error on approve
- **THEN** system displays error message "Failed to approve review: [error details]"
- **AND** review remains in pending list

### Requirement: Admin can reject review
The system SHALL allow admin users to reject pending reviews, preventing them from being visible to customers.

#### Scenario: Reject review successfully
- **WHEN** admin user clicks "Reject" on a pending review
- **THEN** system calls API PUT `/admin/reviews/{id}/approve?approved=false`
- **AND** displays success toast "Review rejected"
- **AND** removes review from pending reviews list
- **AND** review is not visible to customers

#### Scenario: Reject review with reason
- **WHEN** admin user clicks "Reject"
- **THEN** system displays confirmation dialog with optional reason field
- **WHEN** admin user enters reason and confirms
- **THEN** system rejects review
- **AND** saves rejection reason for reference

#### Scenario: Reject review handles error
- **WHEN** API returns error on reject
- **THEN** system displays error message "Failed to reject review: [error details]"
- **AND** review remains in pending list

### Requirement: Admin can filter reviews by rating
The system SHALL allow admin users to filter pending reviews by star rating.

#### Scenario: Filter reviews by low rating
- **WHEN** admin user selects "1-2 stars" from rating filter
- **THEN** system filters pending reviews to show only 1 and 2 star reviews
- **AND** helps admins prioritize addressing negative reviews

#### Scenario: Filter reviews by high rating
- **WHEN** admin user selects "4-5 stars" from rating filter
- **THEN** system filters pending reviews to show only 4 and 5 star reviews

#### Scenario: Clear rating filter
- **WHEN** admin user clears rating filter
- **THEN** system shows all pending reviews

### Requirement: Admin can search reviews
The system SHALL provide search functionality for finding reviews by book title or user email.

#### Scenario: Search reviews by book title
- **WHEN** admin user types "Harry Potter" in search input
- **THEN** system filters reviews to show only reviews for books with "Harry Potter" in title

#### Scenario: Search reviews by user email
- **WHEN** admin user types "user@example.com" in search input
- **THEN** system filters reviews to show only reviews from that user

#### Scenario: Search with no results
- **WHEN** admin user searches with no matching results
- **THEN** system displays "No reviews found matching your search"
