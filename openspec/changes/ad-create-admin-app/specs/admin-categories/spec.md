## ADDED Requirements

### Requirement: Admin can list all categories
The system SHALL display a list of all categories when the admin accesses the categories page.

#### Scenario: Categories list displays successfully
- **WHEN** authenticated admin user navigates to `/categories`
- **THEN** system displays table of categories with columns: ID, Name, Parent Category, Book Count, Actions
- **AND** categories are grouped with parent-child relationships shown
- **AND** shows action buttons: "Edit", "Delete"

#### Scenario: Categories list handles empty state
- **WHEN** there are no categories in the system
- **THEN** system displays empty state message "No categories found"
- **AND** shows "Add Category" button to create first category

### Requirement: Admin can create a new category
The system SHALL allow admin users to create a new category via a form.

#### Scenario: Navigate to create category page
- **WHEN** admin user clicks "Add Category" button
- **THEN** system navigates to `/categories/new`
- **AND** displays category creation form

#### Scenario: Create category with valid data
- **WHEN** admin user submits form with name and optional parent category
- **THEN** system creates category via API POST `/categories`
- **AND** displays success toast "Category created successfully"
- **AND** redirects to `/categories` page
- **AND** new category appears in categories list

#### Scenario: Create category without parent
- **WHEN** admin user submits form with name but no parent category
- **THEN** system creates top-level category
- **AND** parent category field shows "None"

#### Scenario: Create category shows validation errors
- **WHEN** admin user submits form with missing name
- **THEN** system displays validation error "Category name is required"
- **AND** does not submit form

### Requirement: Admin can view category details
The system SHALL display detailed information about a category including its books.

#### Scenario: View category details
- **WHEN** admin user clicks on a category name
- **THEN** system navigates to `/categories/{id}`
- **AND** displays category name, parent category (if any), and description
- **AND** lists all books in this category
- **AND** shows book count
- **AND** displays action buttons: "Edit", "Delete"
- **AND** shows sub-categories if any

#### Scenario: Category with books
- **WHEN** admin user views a category containing books
- **THEN** system displays paginated list of books in that category
- **AND** each book shows title, author, price, and stock

### Requirement: Admin can edit existing category
The system SHALL allow admin users to edit a category's information.

#### Scenario: Navigate to edit category page
- **WHEN** admin user clicks "Edit" action on a category
- **THEN** system navigates to `/categories/{id}/edit`
- **AND** displays edit form pre-populated with current category data

#### Scenario: Update category name successfully
- **WHEN** admin user updates category name and submits
- **THEN** system updates category via API PUT `/categories/{id}`
- **AND** displays success toast "Category updated successfully"
- **AND** redirects to categories list
- **AND** updated name reflects in list

#### Scenario: Update category parent
- **WHEN** admin user changes parent category and submits
- **THEN** system updates category hierarchy
- **AND** category moves to new parent in list view

#### Scenario: Prevent circular category hierarchy
- **WHEN** admin user attempts to set a category's parent to itself or one of its descendants
- **THEN** system displays validation error "Cannot create circular category hierarchy"
- **AND** does not submit form

### Requirement: Admin can delete a category
The system SHALL allow admin users to delete a category with confirmation and safety checks.

#### Scenario: Delete category without books
- **WHEN** admin user clicks "Delete" on a category with no books
- **THEN** system displays confirmation dialog "Are you sure you want to delete this category?"
- **WHEN** admin user confirms
- **THEN** system deletes category via API DELETE `/categories/{id}`
- **AND** displays success toast "Category deleted successfully"
- **AND** category no longer appears in list

#### Scenario: Delete category with books shows warning
- **WHEN** admin user clicks "Delete" on a category containing books
- **THEN** system displays confirmation dialog "This category contains X books. Deleting will remove this category from all books. Are you sure?"
- **WHEN** admin user confirms
- **THEN** system deletes category
- **AND** removes category from all associated books

#### Scenario: Delete category with sub-categories shows warning
- **WHEN** admin user clicks "Delete" on a category with sub-categories
- **THEN** system displays confirmation dialog "This category has X sub-categories. Deleting will also delete all sub-categories. Are you sure?"
- **WHEN** admin user confirms
- **THEN** system deletes category and all sub-categories
