import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import Card from '../src/components/ui/Card';
import Form from '../src/components/ui/Form';
import Input from '../src/components/ui/Input';
import Table from '../src/components/ui/Table';
import type { TableColumn } from '../src/components/ui/Table';

describe('Button', () => {
  it('renders with the requested variant and handles clicks', () => {
    const onClick = vi.fn();
    render(<Button variant="secondary" onClick={onClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toHaveClass('ui-button', 'ui-button--secondary');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to type="button" so it never submits forms accidentally', () => {
    render(<Button>Plain</Button>);

    expect(screen.getByRole('button', { name: 'Plain' })).toHaveAttribute('type', 'button');
  });
});

describe('Input', () => {
  it('associates the label with the input and shows the hint', () => {
    render(<Input label="Email" hint="We never share it." placeholder="you@example.com" />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('We never share it.')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('applies the tone class', () => {
    render(<Badge tone="success">Offer</Badge>);

    expect(screen.getByText('Offer')).toHaveClass('ui-badge', 'ui-badge--success');
  });
});

describe('Card', () => {
  it('renders a title and children', () => {
    render(<Card title="Profile">Body</Card>);

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});

describe('Form', () => {
  it('submits through the wrapper', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <Form onSubmit={onSubmit}>
        <button type="submit">Go</button>
      </Form>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('Table', () => {
  interface Row { id: string; name: string }

  const columns: TableColumn<Row>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name }
  ];

  it('renders headers and rows', () => {
    render(<Table columns={columns} rows={[{ id: '1', name: 'Acme' }]} rowKey={(row) => row.id} />);

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Acme' })).toBeInTheDocument();
  });

  it('shows the empty message when there are no rows', () => {
    render(<Table columns={columns} rows={[]} rowKey={(row: Row) => row.id} emptyMessage="No applications yet." />);

    expect(screen.getByText('No applications yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
