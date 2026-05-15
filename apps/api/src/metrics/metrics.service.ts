import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const dateFilter = { gte: fromDate, lte: toDate };

    const [totalDoctors, totalPatients, totalPrescriptions, byStatus, topDoctors] =
      await Promise.all([
        this.prisma.doctor.count(),
        this.prisma.patient.count(),
        this.prisma.prescription.count({ where: { createdAt: dateFilter } }),
        this.prisma.prescription.groupBy({
          by: ['status'],
          _count: true,
          where: { createdAt: dateFilter },
        }),
        this.prisma.prescription.groupBy({
          by: ['authorId'],
          _count: { _all: true },
          where: { createdAt: dateFilter },
          orderBy: { _count: { authorId: 'desc' } },
          take: 5,
        }),
      ]);

    // Prescriptions by day (last 30 days)
    const byDay = await this.prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT
        DATE_TRUNC('day', "createdAt")::text AS day,
        COUNT(*)::bigint AS count
      FROM "Prescription"
      WHERE "createdAt" >= ${fromDate} AND "createdAt" <= ${toDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `;

    // Enrich top doctors with user info
    const enrichedDoctors = await Promise.all(
      topDoctors.map(async (d) => {
        const doctor = await this.prisma.doctor.findUnique({
          where: { id: d.authorId },
          include: { user: { select: { name: true, email: true } } },
        });
        return { doctor, count: d._count };
      }),
    );

    return {
      totals: {
        doctors: totalDoctors,
        patients: totalPatients,
        prescriptions: totalPrescriptions,
      },
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byDay: byDay.map((d) => ({ day: d.day, count: Number(d.count) })),
      topDoctors: enrichedDoctors,
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    };
  }
}
