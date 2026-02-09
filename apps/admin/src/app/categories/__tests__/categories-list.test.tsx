import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CategoriesListPage from '../page';

const mockGetCategories = vi.fn();
const mockDeleteCategory = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockCategories = [
  { id: 1, name: 'Fiction', parent_id: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Science Fiction', parent_id: 1, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 3, name: 'Non-Fiction', parent_id: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

describe('CategoriesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue(mockCategories);
    mockDeleteCategory.mockResolvedValue(undefined);
  });

  it('should show loading skeletons initially', () => {
    mockGetCategories.mockReturnValue(new Promise(() => {}));
    const { container } = render(<CategoriesListPage />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it('should render page header', async () => {
    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    expect(screen.getByText('Organize your books into categories')).toBeInTheDocument();
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  it('should render categories in table', async () => {
    render(<CategoriesListPage />);

    await waitFor(() => {
      // "Fiction" appears multiple times (as name and as parent), use getAllByText
      expect(screen.getAllByText('Fiction').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Science Fiction')).toBeInTheDocument();
    expect(screen.getByText('Non-Fiction')).toBeInTheDocument();
  });

  it('should show parent category path', async () => {
    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Science Fiction')).toBeInTheDocument();
    });

    // Non-Fiction and Fiction have no parent, so they should show "-"
    // "Fiction" text appears in the parent column for Science Fiction
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state when no categories', async () => {
    mockGetCategories.mockResolvedValue([]);

    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('No categories found')).toBeInTheDocument();
    });
  });

  it('should render Add Category link', async () => {
    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    expect(screen.getByText('Add Category').closest('a')).toHaveAttribute('href', '/categories/new');
  });

  it('should render category name links', async () => {
    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument();
    });

    expect(screen.getByText('Non-Fiction').closest('a')).toHaveAttribute('href', '/categories/3');
    expect(screen.getByText('Science Fiction').closest('a')).toHaveAttribute('href', '/categories/2');
  });

  it('should disable delete for categories with children', async () => {
    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument();
    });

    // Fiction (id: 1) has a child (Science Fiction, parent_id: 1)
    // Find the Fiction row's delete button and check it's disabled
    const rows = screen.getAllByRole('row');
    // Find the row containing Fiction (as name link, not as parent)
    const fictionRow = rows.find(row => {
      const links = within(row).queryAllByRole('link');
      return links.some(l => l.getAttribute('href') === '/categories/1');
    });
    expect(fictionRow).toBeTruthy();
    const disabledBtn = fictionRow?.querySelector('button[disabled]');
    expect(disabledBtn).toBeTruthy();
  });

  it('should open delete dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument();
    });

    // Non-Fiction has no children, so its delete button should be enabled
    const nonFictionRow = screen.getByText('Non-Fiction').closest('tr')!;
    const buttons = within(nonFictionRow).getAllByRole('button');
    // Last button is delete
    const deleteBtn = buttons[buttons.length - 1];
    expect(deleteBtn).not.toBeDisabled();
    await user.click(deleteBtn);

    expect(screen.getByText('Delete Category')).toBeInTheDocument();
  });

  it('should delete category and remove from list', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument();
    });

    const nonFictionRow = screen.getByText('Non-Fiction').closest('tr')!;
    const buttons = within(nonFictionRow).getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith(3);
    });
    expect(toast.success).toHaveBeenCalledWith('Category deleted successfully');
  });

  it('should render table headers', async () => {
    render(<CategoriesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Parent Category')).toBeInTheDocument();
    expect(screen.getByText('Children')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
