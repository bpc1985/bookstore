import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BookDetailPage from '../[id]/page';

const mockGetBook = vi.fn();
const mockDeleteBook = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getBook: (...args: unknown[]) => mockGetBook(...args),
    deleteBook: (...args: unknown[]) => mockDeleteBook(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockBook = {
  id: 1,
  title: 'Test Book',
  author: 'Test Author',
  isbn: '978-1234567890',
  price: '29.99',
  stock_quantity: 10,
  description: 'A great test book',
  cover_image: 'https://example.com/cover.jpg',
  is_deleted: false,
  categories: [
    { id: 1, name: 'Fiction' },
    { id: 2, name: 'Adventure' },
  ],
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-06-20T00:00:00Z',
};

async function renderPage(id: string) {
  const promise = Promise.resolve({ id });
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BookDetailPage params={promise} />
      </Suspense>,
    );
  });
}

describe('BookDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBook.mockResolvedValue(mockBook);
    mockDeleteBook.mockResolvedValue(undefined);
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('should render book details', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Book' })).toBeInTheDocument();
    });

    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    expect(screen.getByText('978-1234567890')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText(/10 in stock/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render book categories as badges', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument();
    });

    expect(screen.getByText('Adventure')).toBeInTheDocument();
  });

  it('should render book description', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('A great test book')).toBeInTheDocument();
    });
  });

  it('should show "No categories assigned" when book has no categories', async () => {
    mockGetBook.mockResolvedValue({ ...mockBook, categories: [] });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('No categories assigned')).toBeInTheDocument();
    });
  });

  it('should show "No description" when book has no description', async () => {
    mockGetBook.mockResolvedValue({ ...mockBook, description: null });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('No description')).toBeInTheDocument();
    });
  });

  it('should show "Book not found" when book fails to load', async () => {
    mockGetBook.mockRejectedValue(new Error('Not found'));

    await renderPage('999');

    await waitFor(() => {
      expect(screen.getByText('Book not found')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Books')).toBeInTheDocument();
  });

  it('should render edit link', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Book' })).toBeInTheDocument();
    });

    expect(screen.getByText('Edit').closest('a')).toHaveAttribute('href', '/books/1/edit');
  });

  it('should render cover image when present', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Cover Image')).toBeInTheDocument();
    });

    const img = screen.getByAltText('Test Book');
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('should not render cover image section when not present', async () => {
    mockGetBook.mockResolvedValue({ ...mockBook, cover_image: null });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Book' })).toBeInTheDocument();
    });

    expect(screen.queryByText('Cover Image')).not.toBeInTheDocument();
  });

  it('should render timestamps', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText(/Published on/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });

  it('should show Deleted status for deleted books', async () => {
    mockGetBook.mockResolvedValue({ ...mockBook, is_deleted: true });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Deleted')).toBeInTheDocument();
    });
  });

  it('should call getBook with parsed id', async () => {
    await renderPage('42');

    await waitFor(() => {
      expect(mockGetBook).toHaveBeenCalledWith(42);
    });
  });
});
