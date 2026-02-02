import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('should handle conditional classes with clsx', () => {
    expect(cn('base-class', true && 'conditional-class', false && 'not-included')).toBe('base-class conditional-class');
  });

  it('should handle array of classes', () => {
    expect(cn(['class1', 'class2', 'class3'])).toBe('class1 class2 class3');
  });

  it('should handle object with boolean values', () => {
    expect(cn({
      'class1': true,
      'class2': false,
      'class3': true,
    })).toBe('class1 class3');
  });

  it('should handle mixed inputs', () => {
    expect(cn('base', ['array', true && 'conditional'], {
      'object': true,
      'not-included': false,
    })).toBe('base array conditional object');
  });

  it('should handle tailwind merge correctly', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });

  it('should handle complex tailwind merge', () => {
    expect(cn('p-4 px-2', 'p-2')).toBe('p-2');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle null and undefined', () => {
    expect(cn(null, undefined, 'class')).toBe('class');
  });

  it('should handle empty strings', () => {
    expect(cn('', 'class', '')).toBe('class');
  });

  it('should handle duplicate classes', () => {
    // Note: tailwind-merge doesn't remove duplicates, it only resolves Tailwind conflicts
    expect(cn('class1', 'class1', 'class2')).toBe('class1 class1 class2');
  });

  it('should handle conflict resolution with tailwind classes', () => {
    expect(cn('text-sm text-lg', 'text-xl')).toBe('text-xl');
  });

  it('should preserve order for non-conflicting classes', () => {
    expect(cn('class1 class2', 'class3')).toBe('class1 class2 class3');
  });

  it('should handle responsive variants correctly', () => {
    expect(cn('px-4', 'sm:px-2', 'md:px-8')).toBe('px-4 sm:px-2 md:px-8');
  });

  it('should handle hover and focus states', () => {
    expect(cn('px-4 hover:px-6 focus:px-8')).toBe('px-4 hover:px-6 focus:px-8');
  });

  it('should handle arbitrary values', () => {
    expect(cn('px-[10px]', 'py-[20px]')).toBe('px-[10px] py-[20px]');
  });

  it('should handle spacing conflicts correctly', () => {
    expect(cn('m-4 mx-2 my-6')).toBe('m-4 mx-2 my-6');
  });

  it('should handle color conflicts correctly', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle background color conflicts', () => {
    expect(cn('bg-white', 'bg-gray-100')).toBe('bg-gray-100');
  });

  it('should combine all types of inputs', () => {
    expect(cn(
      'base',
      ['array-class'],
      { 'object-class': true, 'not-included': false },
      true && 'conditional-class',
      false && 'not-included-conditional'
    )).toBe('base array-class object-class conditional-class');
  });
});
