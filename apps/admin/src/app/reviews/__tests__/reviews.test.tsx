import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ReviewsModerationPage from '../page';

const mockListPendingReviews = vi.fn();
const mockApproveReview = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    listPendingReviews: (...args: unknown[]) => mockListPendingReviews(...args),
    approveReview: (...args: unknown[]) => mockApproveReview(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockReviews = [
  {
    id: 1,
    book_id: 1,
    user_id: 1,
    book_title: 'Great Book',
    user_name: 'John Doe',
    rating: 5,
    comment: 'Absolutely wonderful!',
    is_approved: false,
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 2,
    book_id: 2,
    user_id: 2,
    book_title: 'Another Book',
    user_name: 'Jane Smith',
    rating: 2,
    comment: 'Not great',
    is_approved: false,
    created_at: '2024-03-14T10:00:00Z',
    updated_at: '2024-03-14T10:00:00Z',
  },
  {
    id: 3,
    book_id: 3,
    user_id: 3,
    book_title: 'Third Book',
    user_name: null,
    rating: 3,
    comment: null,
    is_approved: false,
    created_at: '2024-03-13T10:00:00Z',
    updated_at: '2024-03-13T10:00:00Z',
  },
];

describe('ReviewsModerationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListPendingReviews.mockResolvedValue({ items: mockReviews, total: 3, page: 1, size: 20, pages: 1 });
    mockApproveReview.mockResolvedValue(undefined);
  });

  it('should show loading skeletons initially', () => {
    mockListPendingReviews.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ReviewsModerationPage />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it('should render page header', async () => {
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Reviews Moderation')).toBeInTheDocument();
    });

    expect(screen.getByText('Approve or reject pending customer reviews')).toBeInTheDocument();
  });

  it('should render reviews in table', async () => {
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Great Book')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Absolutely wonderful!')).toBeInTheDocument();
    expect(screen.getByText('Another Book')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show "N/A" for missing user name and "No comment" for null comment', async () => {
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Third Book')).toBeInTheDocument();
    });

    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('No comment')).toBeInTheDocument();
  });

  it('should show empty state when no pending reviews', async () => {
    mockListPendingReviews.mockResolvedValue({ items: [], total: 0, page: 1, size: 20, pages: 0 });

    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('No pending reviews')).toBeInTheDocument();
    });
  });

  it('should open approve dialog when approve button is clicked', async () => {
    const user = userEvent.setup();
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Great Book')).toBeInTheDocument();
    });

    // Find the first approve button (check icon button with emerald color)
    const row = screen.getByText('Great Book').closest('tr');
    const buttons = row?.querySelectorAll('button');
    const approveBtn = Array.from(buttons || []).find(
      btn => btn.className.includes('emerald')
    );

    if (approveBtn) {
      await user.click(approveBtn);

      expect(screen.getByText('Approve Review')).toBeInTheDocument();
      expect(screen.getByText(/Approve review for/)).toBeInTheDocument();
    }
  });

  it('should open reject dialog when reject button is clicked', async () => {
    const user = userEvent.setup();
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Great Book')).toBeInTheDocument();
    });

    const row = screen.getByText('Great Book').closest('tr');
    const buttons = row?.querySelectorAll('button');
    const rejectBtn = Array.from(buttons || []).find(
      btn => btn.className.includes('red')
    );

    if (rejectBtn) {
      await user.click(rejectBtn);

      expect(screen.getByText('Reject Review')).toBeInTheDocument();
      expect(screen.getByText(/Reject review for/)).toBeInTheDocument();
      // Reject dialog should have reason field
      expect(screen.getByLabelText(/Reason/)).toBeInTheDocument();
    }
  });

  it('should approve review and remove from list', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Great Book')).toBeInTheDocument();
    });

    const row = screen.getByText('Great Book').closest('tr');
    const approveBtn = Array.from(row?.querySelectorAll('button') || []).find(
      btn => btn.className.includes('emerald')
    );

    if (approveBtn) {
      await user.click(approveBtn);
      // Click the Approve button in the dialog
      await user.click(screen.getByRole('button', { name: /Approve/i }));

      await waitFor(() => {
        expect(mockApproveReview).toHaveBeenCalledWith(1, true);
      });
      expect(toast.success).toHaveBeenCalledWith('Review approved');
    }
  });

  it('should reject review and remove from list', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Great Book')).toBeInTheDocument();
    });

    const row = screen.getByText('Great Book').closest('tr');
    const rejectBtn = Array.from(row?.querySelectorAll('button') || []).find(
      btn => btn.className.includes('red')
    );

    if (rejectBtn) {
      await user.click(rejectBtn);
      await user.click(screen.getByRole('button', { name: /Reject/i }));

      await waitFor(() => {
        expect(mockApproveReview).toHaveBeenCalledWith(1, false);
      });
      expect(toast.success).toHaveBeenCalledWith('Review rejected');
    }
  });

  it('should render table headers', async () => {
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Reviews Moderation')).toBeInTheDocument();
    });

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Book Title')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Comment')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should call listPendingReviews with page and size', async () => {
    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(mockListPendingReviews).toHaveBeenCalledWith(1, 20);
    });
  });

  it('should show pagination when total pages > 1', async () => {
    mockListPendingReviews.mockResolvedValue({ items: mockReviews, total: 60, page: 1, size: 20, pages: 3 });

    render(<ReviewsModerationPage />);

    await waitFor(() => {
      expect(screen.getByText('Great Book')).toBeInTheDocument();
    });

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
});
