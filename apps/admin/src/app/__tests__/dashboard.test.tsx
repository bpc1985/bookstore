import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '../page';

const mockGetAnalytics = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getAnalytics: (...args: unknown[]) => mockGetAnalytics(...args),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const mockAnalytics = {
  total_revenue: '12345.67',
  total_orders: 42,
  pending_orders: 5,
  total_books: 150,
  total_users: 200,
  total_reviews: 75,
  books_by_category: [
    { name: 'Fiction', value: 50 },
    { name: 'Science', value: 30 },
  ],
  user_growth: [
    { month: 'Jan', users: 10 },
    { month: 'Feb', users: 25 },
  ],
  recently_added_books: [
    { date: '2024-01-01', books: 5 },
    { date: '2024-01-02', books: 3 },
  ],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAnalytics.mockResolvedValue(mockAnalytics);
  });

  it('should show loading skeletons initially', () => {
    mockGetAnalytics.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<DashboardPage />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it('should render stat cards after data loads', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$12345.67')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Pending Orders')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Total Books')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Total Reviews')).toBeInTheDocument();
  });

  it('should render greeting based on time of day', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$12345.67')).toBeInTheDocument();
    });

    const hour = new Date().getHours();
    if (hour < 12) {
      expect(screen.getByText('Good morning!')).toBeInTheDocument();
    } else if (hour < 17) {
      expect(screen.getByText('Good afternoon!')).toBeInTheDocument();
    } else {
      expect(screen.getByText('Good evening!')).toBeInTheDocument();
    }
  });

  it('should render chart titles', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Books by Category')).toBeInTheDocument();
    });

    expect(screen.getByText('User Growth (Last 6 Months)')).toBeInTheDocument();
    expect(screen.getByText('Recently Added Books (Last 30 Days)')).toBeInTheDocument();
  });

  it('should render charts when data is available', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$12345.67')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('line-chart')).toHaveLength(2);
  });

  it('should show "No data available" when chart data is empty', async () => {
    mockGetAnalytics.mockResolvedValue({
      ...mockAnalytics,
      books_by_category: [],
      user_growth: [],
      recently_added_books: [],
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$12345.67')).toBeInTheDocument();
    });

    expect(screen.getAllByText('No data available')).toHaveLength(3);
  });

  it('should render stat card links', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$12345.67')).toBeInTheDocument();
    });

    const links = screen.getAllByRole('link');
    const hrefs = links.map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/orders');
    expect(hrefs).toContain('/books');
    expect(hrefs).toContain('/users');
    expect(hrefs).toContain('/reviews');
  });

  it('should handle API error gracefully', async () => {
    mockGetAnalytics.mockRejectedValue(new Error('API Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
