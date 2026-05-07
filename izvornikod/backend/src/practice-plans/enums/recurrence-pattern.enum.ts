/**
 * Obrasci ponavljanja recurring practice plan template-a (FZ-L16, FZ-L17).
 *
 * - DAILY    — svaki dan unutar perioda
 * - WEEKDAYS — pon-pet (1-5 u JS getDay() konvenciji)
 * - WEEKLY   — jednom tjedno, na isti dan u tjednu kao baseDate (scheduledDate template-a)
 * - CUSTOM   — koristi recurrenceDays niz (npr. [1,3,5])
 *
 * recurrenceDays koristi konvenciju Postgres EXTRACT(DOW from date):
 *   0 = nedjelja, 1 = ponedjeljak, ..., 6 = subota
 */
export enum RecurrencePattern {
  DAILY = 'DAILY',
  WEEKDAYS = 'WEEKDAYS',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM',
}
