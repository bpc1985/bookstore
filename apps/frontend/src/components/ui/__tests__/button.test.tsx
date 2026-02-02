import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  describe('rendering', () => {
    it('should render with default variant and size', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'h-9', 'px-4');
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toHaveClass('custom-class');
    });

    it('should render children correctly', () => {
      render(<Button>Button Text</Button>);
      expect(screen.getByText('Button Text')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Button data-testid="test-button">Click me</Button>);
      const button = screen.getByTestId('test-button');
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  describe('variants', () => {
    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button', { name: 'Delete' });
      expect(button).toHaveClass('bg-destructive', 'text-white');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button', { name: 'Outline' });
      expect(button).toHaveClass('border', 'bg-background', 'shadow-xs');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button', { name: 'Secondary' });
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button', { name: 'Ghost' });
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button', { name: 'Link' });
      expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline');
    });
  });

  describe('sizes', () => {
    it('should render default size', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button', { name: 'Default' });
      expect(button).toHaveClass('h-9', 'px-4');
    });

    it('should render sm size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button', { name: 'Small' });
      expect(button).toHaveClass('h-8', 'px-3', 'gap-1.5');
    });

    it('should render lg size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button', { name: 'Large' });
      expect(button).toHaveClass('h-10', 'px-6');
    });

    it('should render icon size', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button', { name: 'Icon' });
      expect(button).toHaveClass('size-9');
    });
  });

  describe('interaction', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const userEvent = (await import('@testing-library/user-event')).default;

      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });

      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: 'Disabled' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });
  });

  describe('focus states', () => {
    it('should have focus-visible styles when focused', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button', { name: 'Focus me' });

      button.focus();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-ring/50', 'focus-visible:ring-[3px]');
    });
  });

  describe('accessibility', () => {
    it('should pass through aria attributes', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('should support aria-invalid for error states', () => {
      render(<Button aria-invalid="true">Invalid</Button>);
      const button = screen.getByRole('button', { name: 'Invalid' });
      expect(button).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('additional props', () => {
    it('should pass through type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should pass through data attributes', () => {
      render(<Button data-testid="test-button">Test</Button>);
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
    });

    it('should support custom id', () => {
      render(<Button id="my-button">My Button</Button>);
      const button = screen.getByRole('button', { name: 'My Button' });
      expect(button).toHaveAttribute('id', 'my-button');
    });
  });

  describe('slot props', () => {
    it('should have data-slot attribute', () => {
      render(<Button>Slot Test</Button>);
      const button = screen.getByRole('button', { name: 'Slot Test' });
      expect(button).toHaveAttribute('data-slot', 'button');
    });

    it('should have data-variant attribute', () => {
      render(<Button variant="destructive">Variant Test</Button>);
      const button = screen.getByRole('button', { name: 'Variant Test' });
      expect(button).toHaveAttribute('data-variant', 'destructive');
    });

    it('should have data-size attribute', () => {
      render(<Button size="lg">Size Test</Button>);
      const button = screen.getByRole('button', { name: 'Size Test' });
      expect(button).toHaveAttribute('data-size', 'lg');
    });
  });
});
