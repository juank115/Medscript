import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ItemsArray } from '@/components/prescriptions/ItemsArray';
import type { PrescriptionFormValues } from '@/components/prescriptions/ItemsArray';

// Wrapper that provides react-hook-form context to ItemsArray
function TestWrapper() {
  const {
    control,
    register,
    formState: { errors },
  } = useForm<PrescriptionFormValues>({
    defaultValues: {
      patientId: '',
      items: [{ name: '', dosage: '', quantity: '', instructions: '' }],
    },
  });

  return <ItemsArray control={control} register={register} errors={errors} />;
}

describe('ItemsArray', () => {
  test('renders one medication item by default', () => {
    render(<TestWrapper />);
    expect(screen.getByText('MEDICAMENTO 1')).toBeInTheDocument();
  });

  test('does not show remove button when only one item', () => {
    render(<TestWrapper />);
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });

  test('adds a second item when clicking "Agregar medicamento"', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    await user.click(screen.getByText(/Agregar medicamento/i));

    expect(screen.getByText('MEDICAMENTO 1')).toBeInTheDocument();
    expect(screen.getByText('MEDICAMENTO 2')).toBeInTheDocument();
  });

  test('shows remove button for each item when there are multiple', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    await user.click(screen.getByText(/Agregar medicamento/i));

    const removeButtons = screen.getAllByText('Eliminar');
    expect(removeButtons).toHaveLength(2);
  });

  test('removes an item when clicking Eliminar', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    await user.click(screen.getByText(/Agregar medicamento/i));
    expect(screen.getByText('MEDICAMENTO 2')).toBeInTheDocument();

    const removeButtons = screen.getAllByText('Eliminar');
    await user.click(removeButtons[1]);

    expect(screen.queryByText('MEDICAMENTO 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });
});
