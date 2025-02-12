import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/dialog';

describe('Dialog', () => {
  it('renders Dialog component', () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Close Dialog</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders DialogOverlay with correct class name', () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(container).toMatchSnapshot('expected html');
  });

  it('renders DialogTitle and DialogDescription', () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
