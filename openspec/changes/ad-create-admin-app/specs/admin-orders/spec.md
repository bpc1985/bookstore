## ADDED Requirements

### Requirement: Admin can list all orders
The system SHALL display a paginated list of all orders when the admin accesses the orders page.

#### Scenario: Orders list displays successfully
- **WHEN** authenticated admin user navigates to `/orders`
- **THEN** system displays table of orders with columns: Order ID, User, Status, Total Amount, Date, Actions
- **AND** orders are sorted by date descending (newest first)
- **AND** table is paginated with 20 orders per page
- **AND** status badges show color-coded statuses: pending (yellow), paid (blue), shipped (purple), completed (green), cancelled (red)
- **AND** status dropdown allows filtering by status

#### Scenario: Filter orders by status
- **WHEN** admin user selects "Pending" from status dropdown
- **THEN** system filters orders list to show only pending orders
- **AND** updates list immediately

#### Scenario: Clear status filter
- **WHEN** admin user clears status filter
- **THEN** system resets to show all orders

### Requirement: Admin can view order details
The system SHALL display detailed information about a specific order including items, shipping address, and status history.

#### Scenario: View order details
- **WHEN** admin user clicks on order ID in orders list
- **THEN** system navigates to `/orders/{id}`
- **AND** displays order information: Order ID, User ID, Status, Total Amount, Shipping Address, Payment Reference, Created Date, Updated Date
- **AND** displays table of order items: Book Title, Author, Quantity, Price at Purchase, Subtotal
- **AND** shows status history with timestamps and notes
- **AND** provides action to update order status

#### Scenario: Order details with status history
- **WHEN** admin user views an order with status changes
- **THEN** system displays timeline of status changes
- **AND** each timeline entry shows: previous status, new status, timestamp, note (if any)

### Requirement: Admin can update order status
The system SHALL allow admin users to update the status of an order with optional notes.

#### Scenario: Update order to next status
- **WHEN** admin user selects "Mark as Paid" action on a pending order
- **THEN** system displays status update form
- **WHEN** admin user submits without note
- **THEN** system updates order status to "paid" via API PUT `/admin/orders/{id}/status`
- **AND** displays success toast "Order status updated"
- **AND** status updates in order detail
- **AND** status history adds new entry

#### Scenario: Update order status with note
- **WHEN** admin user updates order status and adds note "Express shipping requested"
- **THEN** system updates status
- **AND** saves note in status history

#### Scenario: Order status validation
- **WHEN** admin user attempts to update completed order to pending
- **THEN** system displays error "Cannot revert completed order to pending"
- **AND** does not update status

#### Scenario: Cancel order
- **WHEN** admin user updates order status to "cancelled"
- **THEN** system displays confirmation dialog "Are you sure you want to cancel this order?"
- **WHEN** admin user confirms
- **THEN** system cancels order
- **AND** displays success toast "Order cancelled"

### Requirement: Admin can search orders
The system SHALL provide search functionality for finding orders by ID or user email.

#### Scenario: Search orders by ID
- **WHEN** admin user types "1001" in search input
- **THEN** system filters orders to show order with ID 1001

#### Scenario: Search orders by user email
- **WHEN** admin user types "user@example.com" in search input
- **THEN** system filters orders to show all orders from that user

#### Scenario: Search with no results
- **WHEN** admin user searches for non-existent order
- **THEN** system displays "No orders found matching your search"
