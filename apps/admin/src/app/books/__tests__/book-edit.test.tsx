import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditBookPage from '../[id]/edit/page';

const mockPush = vi.fn();
const mockGetBook = vi.fn();
const mockGetCategories = vi.fn();
const mockUpdateBook = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getBook: (...args: unknown[]) => mockGetBook(...args),
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    updateBook: (...args: unknown[]) => mockUpdateBook(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockBook = {
  id: 1,
  title: 'Existing Book',
  author: 'Existing Author',
  isbn: '978-0001112223',
  price: '24.99',
  stock_quantity: 15,
  description: 'An existing book description',
  cover_image: 'https://example.com/cover.jpg',
  is_deleted: false,
  categories: [{ id: 1, name: 'Fiction' }],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

const mockCategories = [
  { id: 1, name: 'Fiction', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Science', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

async function renderPage(id: string) {
  const promise = Promise.resolve({ id });
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EditBookPage params={promise} />
      </Suspense>,
    );
  });
}

describe('EditBookPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBook.mockResolvedValue(mockBook);
    mockGetCategories.mockResolvedValue(mockCategories);
    mockUpdateBook.mockResolvedValue({ ...mockBook, title: 'Updated Title' });
  });

  it('should render page header with book title', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Book')).toBeInTheDocument();
    });
  });

  it('should pre-fill form with existing book data', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByLabelText('Title *')).toHaveValue('Existing Book');
    });

    expect(screen.getByLabelText('Author *')).toHaveValue('Existing Author');
    expect(screen.getByLabelText('ISBN')).toHaveValue('978-0001112223');
    expect(screen.getByLabelText('Price ($) *')).toHaveValue(24.99);
    expect(screen.getByLabelText('Stock Quantity')).toHaveValue(15);
    expect(screen.getByLabelText('Description')).toHaveValue('An existing book description');
    expect(screen.getByLabelText('Cover Image URL')).toHaveValue('https://example.com/cover.jpg');
  });

  it('should submit updated data', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByLabelText('Title *')).toHaveValue('Existing Book');
    });

    const titleInput = screen.getByLabelText('Title *');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Book');

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateBook).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Updated Book',
          author: 'Existing Author',
        }),
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Book updated successfully');
    expect(mockPush).toHaveBeenCalledWith('/books/1');
  });

  it('should show error toast on update failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockUpdateBook.mockRejectedValue(new Error('Server error'));

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByLabelText('Title *')).toHaveValue('Existing Book');
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update book');
    });
  });

  it('should show "Saving..." while submitting', async () => {
    const user = userEvent.setup();
    mockUpdateBook.mockReturnValue(new Promise(() => {}));

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByLabelText('Title *')).toHaveValue('Existing Book');
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('should redirect to /books on load failure', async () => {
    const { toast } = await import('sonner');
    mockGetBook.mockRejectedValue(new Error('Not found'));
    mockGetCategories.mockRejectedValue(new Error('Not found'));

    await renderPage('999');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load book data');
    });

    expect(mockPush).toHaveBeenCalledWith('/books');
  });

  it('should render cancel link back to book detail', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Book')).toBeInTheDocument();
    });

    expect(screen.getByText('Cancel').closest('a')).toHaveAttribute('href', '/books/1');
  });

  it('should render form labels', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Book Details')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Author *')).toBeInTheDocument();
    expect(screen.getByLabelText('ISBN')).toBeInTheDocument();
    expect(screen.getByLabelText('Price ($) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Cover Image URL')).toBeInTheDocument();
  });
});
