import { describe, expect, it } from 'vitest';

import { cn } from '~/utils/tailwind-utils';

describe('tailwind-utils', () => {
  describe('cn', () => {
    it('should merge class names using clsx and tailwind-merge', () => {
      const class1 = 'text-red-500';
      const class2 = { 'bg-blue-500': true };
      const class3 = ['font-bold', { italic: true }];

      expect(cn(class1, class2, class3)).toEqual('text-red-500 bg-blue-500 font-bold italic');
    });

    it('should handle no arguments', () => {
      expect(cn()).toEqual('');
    });
  });
});
