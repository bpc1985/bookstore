import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with default classes', () => {
      render(<Card>Card Content</Card>);
      const card = screen.getByText('Card Content').closest('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-card', 'text-card-foreground', 'rounded-xl', 'border', 'shadow-sm');
      expect(card).toHaveClass('flex', 'flex-col', 'gap-6');
    });

    it('should render card with custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      const card = screen.getByText('Content').closest('[data-slot="card"]');
      expect(card).toHaveClass('custom-class');
    });

    it('should pass through children', () => {
      render(<Card>Children</Card>);
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content').closest('[data-slot="card"]');
      expect(card).toHaveAttribute('data-slot', 'card');
    });
  });

  describe('CardHeader', () => {
    it('should render header with default classes', () => {
      render(<CardHeader>Header Content</CardHeader>);
      const header = screen.getByText('Header Content').closest('[data-slot="card-header"]');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('grid', 'auto-rows-min', 'grid-rows-[auto_auto]');
      expect(header).toHaveClass('items-start', 'gap-2', 'px-6');
    });

    it('should render header with custom className', () => {
      render(<CardHeader className="custom-header">Content</CardHeader>);
      const header = screen.getByText('Content').closest('[data-slot="card-header"]');
      expect(header).toHaveClass('custom-header');
    });

    it('should have data-slot attribute', () => {
      render(<CardHeader>Content</CardHeader>);
      const header = screen.getByText('Content').closest('[data-slot="card-header"]');
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });
  });

  describe('CardTitle', () => {
    it('should render title with default classes', () => {
      render(<CardTitle>Card Title</CardTitle>);
      const title = screen.getByText('Card Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('leading-none', 'font-semibold');
    });

    it('should render title with custom className', () => {
      render(<CardTitle className="text-2xl">Custom Title</CardTitle>);
      const title = screen.getByText('Custom Title');
      expect(title).toHaveClass('text-2xl');
    });

    it('should have data-slot attribute', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });
  });

  describe('CardDescription', () => {
    it('should render description with default classes', () => {
      render(<CardDescription>Card Description</CardDescription>);
      const description = screen.getByText('Card Description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-muted-foreground', 'text-sm');
    });

    it('should render description with custom className', () => {
      render(<CardDescription className="text-base">Custom Description</CardDescription>);
      const description = screen.getByText('Custom Description');
      expect(description).toHaveClass('text-base');
    });

    it('should have data-slot attribute', () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText('Description');
      expect(description).toHaveAttribute('data-slot', 'card-description');
    });
  });

  describe('CardAction', () => {
    it('should render action with correct positioning', () => {
      render(<CardAction>Action</CardAction>);
      const action = screen.getByText('Action').closest('[data-slot="card-action"]');
      expect(action).toBeInTheDocument();
      expect(action).toHaveClass('col-start-2', 'row-span-2', 'row-start-1');
      expect(action).toHaveClass('self-start', 'justify-self-end');
    });

    it('should render action with custom className', () => {
      render(<CardAction className="custom-action">Action</CardAction>);
      const action = screen.getByText('Action').closest('[data-slot="card-action"]');
      expect(action).toHaveClass('custom-action');
    });

    it('should have data-slot attribute', () => {
      render(<CardAction>Action</CardAction>);
      const action = screen.getByText('Action').closest('[data-slot="card-action"]');
      expect(action).toHaveAttribute('data-slot', 'card-action');
    });
  });

  describe('CardContent', () => {
    it('should render content with default classes', () => {
      render(<CardContent>Content</CardContent>);
      const content = screen.getByText('Content').closest('[data-slot="card-content"]');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('px-6');
    });

    it('should render content with custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);
      const content = screen.getByText('Content').closest('[data-slot="card-content"]');
      expect(content).toHaveClass('custom-content');
    });

    it('should have data-slot attribute', () => {
      render(<CardContent>Content</CardContent>);
      const content = screen.getByText('Content').closest('[data-slot="card-content"]');
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });
  });

  describe('CardFooter', () => {
    it('should render footer with default classes', () => {
      render(<CardFooter>Footer</CardFooter>);
      const footer = screen.getByText('Footer').closest('[data-slot="card-footer"]');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'px-6');
    });

    it('should render footer with custom className', () => {
      render(<CardFooter className="justify-end">Footer</CardFooter>);
      const footer = screen.getByText('Footer').closest('[data-slot="card-footer"]');
      expect(footer).toHaveClass('justify-end');
    });

    it('should have data-slot attribute', () => {
      render(<CardFooter>Footer</CardFooter>);
      const footer = screen.getByText('Footer').closest('[data-slot="card-footer"]');
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });
  });

  describe('complete card structure', () => {
    it('should render complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
      expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should pass through aria attributes', () => {
      render(<Card role="region" aria-label="Card region">Content</Card>);
      const card = screen.getByRole('region', { name: 'Card region' });
      expect(card).toBeInTheDocument();
    });
  });

  describe('additional props', () => {
    it('should pass through data attributes', () => {
      render(<Card data-testid="test-card">Content</Card>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });

    it('should support custom id', () => {
      render(<Card id="custom-card">Content</Card>);
      const card = screen.getByText('Content').closest('[data-slot="card"]');
      expect(card).toHaveAttribute('id', 'custom-card');
    });

    it('should support onClick handler', async () => {
      const handleClick = vi.fn();
      const userEvent = (await import('@testing-library/user-event')).default;

      render(<Card onClick={handleClick} data-testid="card">Clickable</Card>);
      const card = screen.getByTestId('card');

      await userEvent.click(card);
      expect(handleClick).toHaveBeenCalled();
    });
  });
});
