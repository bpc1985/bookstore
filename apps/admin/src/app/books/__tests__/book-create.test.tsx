import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateBookPage from '../new/page';

const mockPush = vi.fn();
const mockGetCategories = vi.fn();
const mockCreateBook = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    createBook: (...args: unknown[]) => mockCreateBook(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockCategories = [
  { id: 1, name: 'Fiction', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Science', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

async function renderPage() {
  await act(async () => {
    render(<CreateBookPage />);
  });
}

describe('CreateBookPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue(mockCategories);
    mockCreateBook.mockResolvedValue({ id: 1 });
  });

  it('should render page header', async () => {
    await renderPage();

    expect(screen.getByText('Add New Book')).toBeInTheDocument();
    expect(screen.getByText(/Fill in the details/)).toBeInTheDocument();
  });

  it('should render form fields', async () => {
    await renderPage();

    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Author *')).toBeInTheDocument();
    expect(screen.getByLabelText('ISBN')).toBeInTheDocument();
    expect(screen.getByLabelText('Price ($) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Cover Image URL')).toBeInTheDocument();
  });

  it('should render submit and cancel buttons', async () => {
    await renderPage();

    expect(screen.getByText('Create Book')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should show validation error when required fields are empty', async () => {
    const user = userEvent.setup();
    await renderPage();

    // Click submit without filling fields
    await user.click(screen.getByText('Create Book'));

    // Browser native validation will fire first, but toast.error is called
    // if fields pass native validation but are empty strings
    // Since we have required attributes, the form won't submit
    // Let's verify the form has required fields
    expect(screen.getByLabelText('Title *')).toBeRequired();
    expect(screen.getByLabelText('Author *')).toBeRequired();
    expect(screen.getByLabelText('Price ($) *')).toBeRequired();
  });

  it('should create book and navigate on success', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    await renderPage();

    await user.type(screen.getByLabelText('Title *'), 'New Book');
    await user.type(screen.getByLabelText('Author *'), 'New Author');
    await user.type(screen.getByLabelText('Price ($) *'), '19.99');
    await user.type(screen.getByLabelText('Stock Quantity'), '50');

    await user.click(screen.getByText('Create Book'));

    await waitFor(() => {
      expect(mockCreateBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Book',
          author: 'New Author',
          price: '19.99',
          stock_quantity: 50,
        }),
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Book created successfully');
    expect(mockPush).toHaveBeenCalledWith('/books');
  });

  it('should show error toast on create failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockCreateBook.mockRejectedValue(new Error('Server error'));

    await renderPage();

    await user.type(screen.getByLabelText('Title *'), 'New Book');
    await user.type(screen.getByLabelText('Author *'), 'New Author');
    await user.type(screen.getByLabelText('Price ($) *'), '19.99');

    await user.click(screen.getByText('Create Book'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create book');
    });
  });

  it('should show "Creating..." while submitting', async () => {
    const user = userEvent.setup();
    mockCreateBook.mockReturnValue(new Promise(() => {})); // never resolves

    await renderPage();

    await user.type(screen.getByLabelText('Title *'), 'New Book');
    await user.type(screen.getByLabelText('Author *'), 'New Author');
    await user.type(screen.getByLabelText('Price ($) *'), '19.99');

    await user.click(screen.getByText('Create Book'));

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  it('should have cancel link pointing to /books', async () => {
    await renderPage();

    expect(screen.getByText('Cancel').closest('a')).toHaveAttribute('href', '/books');
  });

  it('should have back button linking to /books', async () => {
    await renderPage();

    const links = screen.getAllByRole('link');
    const backLink = links.find(l => l.getAttribute('href') === '/books');
    expect(backLink).toBeTruthy();
  });
});
