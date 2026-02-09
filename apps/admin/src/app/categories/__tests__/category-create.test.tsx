import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateCategoryPage from '../new/page';

const mockPush = vi.fn();
const mockGetCategories = vi.fn();
const mockCreateCategory = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockCategories = [
  { id: 1, name: 'Fiction', parent_id: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Non-Fiction', parent_id: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

async function renderPage() {
  await act(async () => {
    render(<CreateCategoryPage />);
  });
}

describe('CreateCategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue(mockCategories);
    mockCreateCategory.mockResolvedValue({ id: 3 });
  });

  it('should render page header', async () => {
    await renderPage();

    expect(screen.getByText('Add New Category')).toBeInTheDocument();
    expect(screen.getByText(/Create a new category/)).toBeInTheDocument();
  });

  it('should render form fields', async () => {
    await renderPage();

    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    // Parent Category is a Select, check label text instead of getByLabelText
    expect(screen.getByText('Parent Category')).toBeInTheDocument();
  });

  it('should render submit and cancel buttons', async () => {
    await renderPage();

    expect(screen.getByText('Create Category')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should have required name field', async () => {
    await renderPage();
    expect(screen.getByLabelText('Name *')).toBeRequired();
  });

  it('should create category and navigate on success', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    await renderPage();

    await user.type(screen.getByLabelText('Name *'), 'New Category');
    await user.click(screen.getByText('Create Category'));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: 'New Category',
        parent_id: null,
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Category created successfully');
    expect(mockPush).toHaveBeenCalledWith('/categories');
  });

  it('should show error toast on create failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockCreateCategory.mockRejectedValue(new Error('Server error'));

    await renderPage();

    await user.type(screen.getByLabelText('Name *'), 'New Category');
    await user.click(screen.getByText('Create Category'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create category');
    });
  });

  it('should show "Creating..." while submitting', async () => {
    const user = userEvent.setup();
    mockCreateCategory.mockReturnValue(new Promise(() => {}));

    await renderPage();

    await user.type(screen.getByLabelText('Name *'), 'New Category');
    await user.click(screen.getByText('Create Category'));

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  it('should have cancel link pointing to /categories', async () => {
    await renderPage();

    expect(screen.getByText('Cancel').closest('a')).toHaveAttribute('href', '/categories');
  });

  it('should have back button linking to /categories', async () => {
    await renderPage();

    const links = screen.getAllByRole('link');
    const backLink = links.find(l => l.getAttribute('href') === '/categories');
    expect(backLink).toBeTruthy();
  });

  it('should show form card title', async () => {
    await renderPage();

    expect(screen.getByText('Category Details')).toBeInTheDocument();
    expect(screen.getByText('Fields marked with * are required')).toBeInTheDocument();
  });
});
