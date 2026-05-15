// Mock data para modo demo (sin backend)
import type { Prescription, PaginatedPrescriptions } from '@/lib/queries/prescriptions';
import type { Metrics } from '@/lib/queries/metrics';

const doctor1 = { id: 'd1', specialty: 'Medicina General', user: { name: 'Dr. Carlos Rodríguez', email: 'dr@test.com' } };
const doctor2 = { id: 'd2', specialty: 'Cardiología', user: { name: 'Dra. Ana García', email: 'dr2@test.com' } };
const patient1 = { id: 'p1', user: { name: 'María López', email: 'patient@test.com' } };
const patient2 = { id: 'p2', user: { name: 'Jorge Martínez', email: 'patient2@test.com' } };

export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-1',
    code: 'RX-A3F7B2C1',
    status: 'PENDING',
    notes: 'Tomar con abundante agua. Evitar exposición solar.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    author: doctor1,
    patient: patient1,
    items: [
      { id: 'i1', name: 'Amoxicilina', dosage: '500mg', quantity: '21 comprimidos', instructions: 'Tomar 1 cada 8 horas' },
      { id: 'i2', name: 'Ibuprofeno', dosage: '400mg', quantity: '15 comprimidos', instructions: 'Tomar 1 cada 6 horas con comida' },
    ],
  },
  {
    id: 'rx-2',
    code: 'RX-C9D4E1F5',
    status: 'CONSUMED',
    notes: undefined,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    author: doctor1,
    patient: patient2,
    items: [
      { id: 'i3', name: 'Omeprazol', dosage: '20mg', quantity: '30 cápsulas', instructions: 'Tomar 1 en ayunas' },
    ],
  },
  {
    id: 'rx-3',
    code: 'RX-B8G2H7J3',
    status: 'PENDING',
    notes: 'Control en 2 semanas.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    author: doctor2,
    patient: patient1,
    items: [
      { id: 'i4', name: 'Atorvastatina', dosage: '10mg', quantity: '30 comprimidos', instructions: 'Tomar 1 por noche' },
      { id: 'i5', name: 'Enalapril', dosage: '5mg', quantity: '30 comprimidos', instructions: 'Tomar 1 por la mañana' },
      { id: 'i6', name: 'AAS', dosage: '100mg', quantity: '30 comprimidos', instructions: 'Tomar 1 con el desayuno' },
    ],
  },
  {
    id: 'rx-4',
    code: 'RX-K1L5M9N2',
    status: 'CONSUMED',
    notes: undefined,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    author: doctor1,
    patient: patient2,
    items: [
      { id: 'i7', name: 'Loratadina', dosage: '10mg', quantity: '10 comprimidos', instructions: 'Tomar 1 por día' },
    ],
  },
  {
    id: 'rx-5',
    code: 'RX-P3Q7R1S6',
    status: 'PENDING',
    notes: 'No mezclar con alcohol.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: doctor2,
    patient: patient2,
    items: [
      { id: 'i8', name: 'Metronidazol', dosage: '500mg', quantity: '14 comprimidos', instructions: 'Tomar 1 cada 12 horas' },
      { id: 'i9', name: 'Probiótico', dosage: '1 sobre', quantity: '14 sobres', instructions: 'Tomar con cada dosis de antibiótico' },
    ],
  },
];

export const MOCK_PAGINATED: PaginatedPrescriptions = {
  data: MOCK_PRESCRIPTIONS,
  total: MOCK_PRESCRIPTIONS.length,
  page: 1,
  limit: 10,
};

// Last 30 days with some data
function mockByDay() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({
      day: d.toISOString(),
      count: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : i % 7 === 0 ? 4 : i < 5 ? 1 : 0,
    });
  }
  return days;
}

export const MOCK_METRICS: Metrics = {
  totals: { doctors: 5, patients: 24, prescriptions: 87 },
  byStatus: [
    { status: 'PENDING', count: 34 },
    { status: 'CONSUMED', count: 53 },
  ],
  byDay: mockByDay(),
  topDoctors: [
    { doctor: doctor1, count: 42 },
    { doctor: doctor2, count: 28 },
    { doctor: { user: { name: 'Dr. Martín Sosa' } }, count: 17 },
  ],
  period: {
    from: new Date(Date.now() - 30 * 86400000).toISOString(),
    to: new Date().toISOString(),
  },
};

export const MOCK_PATIENTS = [
  { id: 'p1', user: { name: 'María López', email: 'patient@test.com' } },
  { id: 'p2', user: { name: 'Jorge Martínez', email: 'patient2@test.com' } },
];

// Route pattern → mock response
export const MOCK_ROUTES: Record<string, unknown> = {
  '/prescriptions': MOCK_PAGINATED,
  '/me/prescriptions': MOCK_PAGINATED,
  '/admin/prescriptions': MOCK_PAGINATED,
  '/admin/metrics': MOCK_METRICS,
  '/users/patients': MOCK_PATIENTS,
};

export function getMockResponse(path: string): unknown | null {
  // Exact match
  if (MOCK_ROUTES[path]) return MOCK_ROUTES[path];

  // Paginated with query string
  for (const key of Object.keys(MOCK_ROUTES)) {
    if (path.startsWith(key + '?') || path.startsWith(key)) {
      return MOCK_ROUTES[key];
    }
  }

  // Single prescription: /prescriptions/:id
  const rxMatch = path.match(/^\/prescriptions\/([^/]+)$/);
  if (rxMatch) {
    const found = MOCK_PRESCRIPTIONS.find((rx) => rx.id === rxMatch[1]);
    return found ?? MOCK_PRESCRIPTIONS[0];
  }

  return null;
}
