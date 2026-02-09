import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BooksListPage from '../page';

const mockGetBooks = vi.fn();
const mockGetCategories = vi.fn();
const mockDeleteBook = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getBooks: (...args: unknown[]) => mockGetBooks(...args),
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    deleteBook: (...args: unknown[]) => mockDeleteBook(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockBooks = [
  { id: 1, title: 'Book One', author: 'Author A', price: '19.99', stock_quantity: 10, is_deleted: false },
  { id: 2, title: 'Book Two', author: 'Author B', price: '29.99', stock_quantity: 0, is_deleted: false },
  { id: 3, title: 'Book Three', author: 'Author C', price: '9.99', stock_quantity: 5, is_deleted: true },
];

const mockCategories = [
  { id: 1, name: 'Fiction', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Science', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

describe('BooksListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBooks.mockResolvedValue({ items: mockBooks, total: 3, page: 1, size: 20, pages: 1 });
    mockGetCategories.mockResolvedValue(mockCategories);
    mockDeleteBook.mockResolvedValue(undefined);
  });

  it('should show loading skeletons initially', async () => {
    mockGetBooks.mockReturnValue(new Promise(() => {}));
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(<BooksListPage />));
    });
    expect(container!.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it('should render page header', async () => {
    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage your book inventory')).toBeInTheDocument();
    expect(screen.getByText('Add Book')).toBeInTheDocument();
  });

  it('should render books in table', async () => {
    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('Book One')).toBeInTheDocument();
    });

    expect(screen.getByText('Author A')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('Book Two')).toBeInTheDocument();
    expect(screen.getByText('Author B')).toBeInTheDocument();
  });

  it('should show status badges correctly', async () => {
    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('Book One')).toBeInTheDocument();
    });

    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  it('should show empty state when no books', async () => {
    mockGetBooks.mockResolvedValue({ items: [], total: 0, page: 1, size: 20, pages: 0 });

    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('No books found')).toBeInTheDocument();
    });
  });

  it('should render Add Book link', async () => {
    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });

    const addLink = screen.getByText('Add Book').closest('a');
    expect(addLink).toHaveAttribute('href', '/books/new');
  });

  it('should render book title links', async () => {
    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('Book One')).toBeInTheDocument();
    });

    expect(screen.getByText('Book One').closest('a')).toHaveAttribute('href', '/books/1');
    expect(screen.getByText('Book Two').closest('a')).toHaveAttribute('href', '/books/2');
  });

  it('should open delete dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('Book One')).toBeInTheDocument();
    });

    // Find the row for Book One and click the delete button
    const row = screen.getByText('Book One').closest('tr')!;
    const buttons = within(row).getAllByRole('button');
    // The last button in the row is the delete button
    const deleteBtn = buttons[buttons.length - 1];
    await user.click(deleteBtn);

    expect(screen.getByText('Delete Book')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('should delete book and remove from list', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('Book One')).toBeInTheDocument();
    });

    // Click delete button for first book
    const row = screen.getByText('Book One').closest('tr')!;
    const buttons = within(row).getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);

    // Confirm delete in dialog
    const dialogDeleteBtn = screen.getByRole('button', { name: 'Delete' });
    await user.click(dialogDeleteBtn);

    await waitFor(() => {
      expect(mockDeleteBook).toHaveBeenCalledWith(1);
    });
    expect(toast.success).toHaveBeenCalledWith('Book deleted successfully');
  });

  it('should show pagination when total pages > 1', async () => {
    mockGetBooks.mockResolvedValue({ items: mockBooks, total: 60, page: 1, size: 20, pages: 3 });

    render(<BooksListPage />);

    await waitFor(() => {
      expect(screen.getByText('Book One')).toBeInTheDocument();
    });

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should call getBooks with search params', async () => {
    render(<BooksListPage />);

    await waitFor(() => {
      expect(mockGetBooks).toHaveBeenCalledWith({
        search: undefined,
        category_id: undefined,
        page: 1,
        size: 20,
      });
    });
  });
});
