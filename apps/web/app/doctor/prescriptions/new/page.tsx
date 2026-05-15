'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreatePrescription } from '@/lib/queries/prescriptions';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { ItemsArray } from '@/components/prescriptions/ItemsArray';
import type { PrescriptionFormValues } from '@/components/prescriptions/ItemsArray';

const itemSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  dosage: z.string().optional(),
  quantity: z.string().optional(),
  instructions: z.string().optional(),
});

const schema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Agrega al menos un medicamento'),
});

type FormData = PrescriptionFormValues;

interface Patient {
  id: string;
  user: { name: string; email: string };
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid var(--apple-border)',
        boxShadow: 'var(--apple-shadow)',
        padding: '24px',
      }}
    >
      <h2
        className="text-[15px] font-semibold mb-4"
        style={{ color: 'var(--apple-text)', letterSpacing: '-0.01em' }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreatePrescription();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => apiFetch('/users/patients'),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ name: '', dosage: '', quantity: '', instructions: '' }] },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await mutateAsync(data) as { id: string };
      toast.success('Prescripción creada exitosamente');
      router.push(`/doctor/prescriptions/${result.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="max-w-[680px] animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] mb-3"
          style={{ color: 'var(--apple-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <h1
          className="text-[28px] font-semibold tracking-tight"
          style={{ color: 'var(--apple-text)', letterSpacing: '-0.02em' }}
        >
          Nueva Prescripción
        </h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--apple-text-2)' }}>
          Completa los datos del paciente y los medicamentos
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Patient */}
        <SectionCard title="Paciente">
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--apple-text-2)' }}>
              Seleccionar paciente
            </label>
            <select {...register('patientId')} className="apple-select">
              <option value="">— Seleccionar paciente —</option>
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.name} ({p.user.email})
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--apple-red)' }}>
                {errors.patientId.message}
              </p>
            )}
          </div>
        </SectionCard>

        {/* Medications */}
        <SectionCard title="Medicamentos">
          <ItemsArray control={control} register={register} errors={errors} />
        </SectionCard>

        {/* Notes */}
        <SectionCard title="Notas del médico">
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Observaciones, instrucciones especiales, advertencias..."
            className="apple-input"
            style={{ resize: 'none', minHeight: 'auto' }}
          />
        </SectionCard>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="apple-btn apple-btn-primary"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Creando...
              </span>
            ) : 'Crear prescripción'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="apple-btn apple-btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
