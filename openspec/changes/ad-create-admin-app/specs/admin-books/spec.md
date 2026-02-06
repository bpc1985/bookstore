## ADDED Requirements

### Requirement: Admin can list all books
The system SHALL display a paginated list of all books when the admin accesses the books page.

#### Scenario: Books list displays successfully
- **WHEN** authenticated admin user navigates to `/books`
- **THEN** system displays table of books with columns: ID, Title, Author, Price, Stock, Status, Actions
- **AND** table is paginated with 20 books per page
- **AND** pagination controls show current page and total pages
- **AND** search input allows filtering by title or author
- **AND** category dropdown allows filtering by category

#### Scenario: Books list handles empty state
- **WHEN** there are no books in the system
- **THEN** system displays empty state message "No books found"
- **AND** shows "Add Book" button to create first book

#### Scenario: Books list shows loading state
- **WHEN** books list is loading
- **THEN** system displays skeleton table rows
- **AND** disables pagination and search controls during loading

### Requirement: Admin can create a new book
The system SHALL allow admin users to create a new book via a form with all required fields.

#### Scenario: Navigate to create book page
- **WHEN** admin user clicks "Add Book" button
- **THEN** system navigates to `/books/new`
- **AND** displays book creation form

#### Scenario: Create book with valid data
- **WHEN** admin user submits form with title, author, price, description, cover image, and categories
- **THEN** system creates book via API POST `/books`
- **AND** displays success toast "Book created successfully"
- **AND** redirects to `/books` page
- **AND** new book appears in books list

#### Scenario: Create book shows validation errors
- **WHEN** admin user submits form with missing required fields
- **THEN** system displays validation error messages below each invalid field
- **AND** highlights invalid fields in red
- **AND** does not submit form

#### Scenario: Create book handles API error
- **WHEN** API returns error on book creation
- **THEN** system displays error message "Failed to create book: [error details]"
- **AND** keeps user on creation form

### Requirement: Admin can view book details
The system SHALL display detailed information about a specific book when admin accesses the book detail page.

#### Scenario: View book details
- **WHEN** admin user clicks "View" action on a book
- **THEN** system navigates to `/books/{id}`
- **AND** displays book title, author, price, description, cover image, stock count, status
- **AND** lists all assigned categories
- **AND** shows all reviews for the book
- **AND** displays action buttons: "Edit", "Delete"

#### Scenario: Book detail shows loading state
- **WHEN** book detail is loading
- **THEN** system displays skeleton placeholders for book information

#### Scenario: Book detail handles not found
- **WHEN** book with given ID does not exist
- **THEN** system displays "Book not found" error message
- **AND** provides link back to books list

### Requirement: Admin can edit existing book
The system SHALL allow admin users to edit an existing book's information.

#### Scenario: Navigate to edit book page
- **WHEN** admin user clicks "Edit" action on a book
- **THEN** system navigates to `/books/{id}/edit`
- **AND** displays edit form pre-populated with current book data

#### Scenario: Update book successfully
- **WHEN** admin user submits edit form with changes
- **THEN** system updates book via API PUT `/books/{id}`
- **AND** displays success toast "Book updated successfully"
- **AND** redirects to book detail page
- **AND** updated information reflects in books list

#### Scenario: Update book shows validation errors
- **WHEN** admin user submits edit form with invalid data
- **THEN** system displays validation error messages
- **AND** does not submit form

### Requirement: Admin can delete a book
The system SHALL allow admin users to delete a book with confirmation.

#### Scenario: Delete book with confirmation
- **WHEN** admin user clicks "Delete" action on a book
- **THEN** system displays confirmation dialog "Are you sure you want to delete this book?"
- **WHEN** admin user confirms deletion
- **THEN** system deletes book via API DELETE `/books/{id}`
- **AND** displays success toast "Book deleted successfully"
- **AND** redirects to books list
- **AND** book no longer appears in list

#### Scenario: Cancel book deletion
- **WHEN** admin user clicks "Delete" action and then cancels confirmation
- **THEN** system closes confirmation dialog
- **AND** book remains in system

#### Scenario: Delete book handles error
- **WHEN** API returns error on book deletion
- **THEN** system displays error message "Failed to delete book: [error details]"
- **AND** keeps confirmation dialog closed

### Requirement: Admin can search and filter books
The system SHALL provide search and filter functionality for the books list.

#### Scenario: Search books by title
- **WHEN** admin user types "Harry Potter" in search input
- **THEN** system filters books list to show only books with "Harry Potter" in title
- **AND** updates list in real-time as user types

#### Scenario: Filter books by category
- **WHEN** admin user selects "Fiction" from category dropdown
- **THEN** system filters books list to show only books in "Fiction" category
- **AND** displays count of filtered books

#### Scenario: Clear filters
- **WHEN** admin user clears search input or category selection
- **THEN** system resets filters
- **AND** displays all books
