import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditCategoryPage from '../[id]/edit/page';

const mockPush = vi.fn();
const mockGetCategories = vi.fn();
const mockUpdateCategory = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockCategories = [
  { id: 1, name: 'Fiction', parent_id: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Science', parent_id: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 3, name: 'Sci-Fi', parent_id: 1, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

async function renderPage(id: string) {
  const promise = Promise.resolve({ id });
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EditCategoryPage params={promise} />
      </Suspense>,
    );
  });
}

describe('EditCategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue(mockCategories);
    mockUpdateCategory.mockResolvedValue({ id: 1 });
  });

  it('should render page header', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
    });
  });

  it('should pre-fill form with category data', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByLabelText('Name *')).toHaveValue('Fiction');
    });
  });

  it('should pre-fill parent for child category', async () => {
    await renderPage('3');

    await waitFor(() => {
      expect(screen.getByLabelText('Name *')).toHaveValue('Sci-Fi');
    });
  });

  it('should update category and navigate on success', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByLabelText('Name *')).toHaveValue('Fiction');
    });

    const nameInput = screen.getByLabelText('Name *');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Fiction');

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith(1, {
        name: 'Updated Fiction',
        parent_id: null,
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Category updated successfully');
    expect(mockPush).toHaveBeenCalledWith('/categories');
  });

  it('should show error toast on update failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockUpdateCategory.mockRejectedValue(new Error('Server error'));

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByLabelText('Name *')).toHaveValue('Fiction');
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update category');
    });
  });

  it('should show "Saving..." while submitting', async () => {
    const user = userEvent.setup();
    mockUpdateCategory.mockReturnValue(new Promise(() => {}));

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByLabelText('Name *')).toHaveValue('Fiction');
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('should redirect on load failure', async () => {
    const { toast } = await import('sonner');
    mockGetCategories.mockRejectedValue(new Error('Not found'));

    await renderPage('999');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load category data');
    });

    expect(mockPush).toHaveBeenCalledWith('/categories');
  });

  it('should have cancel link to /categories', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
    });

    expect(screen.getByText('Cancel').closest('a')).toHaveAttribute('href', '/categories');
  });
});
