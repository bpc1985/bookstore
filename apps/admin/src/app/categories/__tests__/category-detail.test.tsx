import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CategoryDetailPage from '../[id]/page';

const mockGetCategories = vi.fn();
const mockGetBooks = vi.fn();
const mockDeleteCategory = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    getBooks: (...args: unknown[]) => mockGetBooks(...args),
    deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockCategories = [
  { id: 1, name: 'Fiction', parent_id: null, created_at: '2024-03-15T10:00:00Z', updated_at: '2024-03-15T10:00:00Z' },
  { id: 2, name: 'Science', parent_id: null, created_at: '2024-03-15T10:00:00Z', updated_at: '2024-03-15T10:00:00Z' },
];

const mockBooks = [
  { id: 1, title: 'Book A', author: 'Author A', price: '19.99', stock_quantity: 10 },
  { id: 2, title: 'Book B', author: 'Author B', price: '29.99', stock_quantity: 5 },
];

async function renderPage(id: string) {
  const promise = Promise.resolve({ id });
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <CategoryDetailPage params={promise} />
      </Suspense>,
    );
  });
}

describe('CategoryDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue(mockCategories);
    mockGetBooks.mockResolvedValue({ items: mockBooks, total: 2, page: 1, size: 100, pages: 1 });
    mockDeleteCategory.mockResolvedValue(undefined);
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('should render category details', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Fiction' })).toBeInTheDocument();
    });

    expect(screen.getByText('Category details')).toBeInTheDocument();
    expect(screen.getByText('Category Information')).toBeInTheDocument();
    expect(screen.getByText('None (top-level)')).toBeInTheDocument();
  });

  it('should render books in category', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Book A')).toBeInTheDocument();
    });

    expect(screen.getByText('Author A')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('Book B')).toBeInTheDocument();
  });

  it('should show book count in statistics', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show "No books in this category" when empty', async () => {
    mockGetBooks.mockResolvedValue({ items: [], total: 0, page: 1, size: 100, pages: 0 });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('No books in this category')).toBeInTheDocument();
    });
  });

  it('should show "Category not found" for invalid id', async () => {
    mockGetCategories.mockResolvedValue([]);

    await renderPage('999');

    await waitFor(() => {
      expect(screen.getByText('Category not found')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Categories')).toBeInTheDocument();
  });

  it('should render edit link', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Fiction' })).toBeInTheDocument();
    });

    expect(screen.getByText('Edit').closest('a')).toHaveAttribute('href', '/categories/1/edit');
  });

  it('should show parent category ID when parent exists', async () => {
    const categoriesWithParent = [
      ...mockCategories,
      { id: 3, name: 'Sci-Fi', parent_id: 1, created_at: '2024-03-15T10:00:00Z', updated_at: '2024-03-15T10:00:00Z' },
    ];
    mockGetCategories.mockResolvedValue(categoriesWithParent);

    await renderPage('3');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sci-Fi' })).toBeInTheDocument();
    });

    expect(screen.getByText('ID: 1')).toBeInTheDocument();
  });

  it('should render book links to book detail pages', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Book A')).toBeInTheDocument();
    });

    expect(screen.getByText('Book A').closest('a')).toHaveAttribute('href', '/books/1');
    expect(screen.getByText('Book B').closest('a')).toHaveAttribute('href', '/books/2');
  });
});
