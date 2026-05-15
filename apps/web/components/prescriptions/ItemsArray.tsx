'use client';

import { Control, FieldErrors, UseFormRegister, useFieldArray } from 'react-hook-form';

export interface PrescriptionItemValue {
  name: string;
  dosage?: string;
  quantity?: string;
  instructions?: string;
}

export interface PrescriptionFormValues {
  patientId: string;
  notes?: string;
  items: PrescriptionItemValue[];
}

interface Props {
  control: Control<PrescriptionFormValues>;
  register: UseFormRegister<PrescriptionFormValues>;
  errors: FieldErrors<PrescriptionFormValues>;
}

export function ItemsArray({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <div>
      {errors.items?.root && (
        <p className="mb-3 text-[12px]" style={{ color: 'var(--apple-red)' }}>
          {errors.items.root.message}
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-4 rounded-[14px]"
            style={{ background: 'var(--apple-bg-2)', border: '1px solid var(--apple-border-2)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--apple-text-2)' }}>
                MEDICAMENTO {index + 1}
              </span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-[12px] font-medium"
                  style={{ color: 'var(--apple-red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--apple-text-2)' }}>
                  Nombre *
                </label>
                <input
                  {...register(`items.${index}.name`)}
                  placeholder="ej. Amoxicilina"
                  className="apple-input"
                  style={{ background: '#ffffff' }}
                />
                {errors.items?.[index]?.name && (
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--apple-red)' }}>
                    {errors.items[index]?.name?.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--apple-text-2)' }}>
                  Dosis
                </label>
                <input
                  {...register(`items.${index}.dosage`)}
                  placeholder="ej. 500mg"
                  className="apple-input"
                  style={{ background: '#ffffff' }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--apple-text-2)' }}>
                  Cantidad
                </label>
                <input
                  {...register(`items.${index}.quantity`)}
                  placeholder="ej. 21 comprimidos"
                  className="apple-input"
                  style={{ background: '#ffffff' }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--apple-text-2)' }}>
                  Indicaciones
                </label>
                <input
                  {...register(`items.${index}.instructions`)}
                  placeholder="ej. Tomar 1 cada 8 horas con alimentos"
                  className="apple-input"
                  style={{ background: '#ffffff' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => append({ name: '', dosage: '', quantity: '', instructions: '' })}
        className="mt-3 flex items-center gap-2 text-[14px] font-medium"
        style={{ color: 'var(--apple-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Agregar medicamento
      </button>
    </div>
  );
}
