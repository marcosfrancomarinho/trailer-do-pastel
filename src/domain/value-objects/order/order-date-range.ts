import { DomainError } from '../../errors/domain-error.js';

const TIME_ZONE = 'America/Fortaleza';
const OFFSET_HOURS = 3;

export class OrderDateRange {
  private constructor(
    private start: Date,
    private end: Date,
  ) {}

  /** Returns the UTC interval for a calendar day in Imperatriz (UTC-03:00). */
  public static create(value?: unknown, now = new Date()): OrderDateRange {
    let day: string;

    if (value === undefined) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);

      const part = (type: string): string => parts.find(item => item.type === type)?.value ?? '';
      day = `${part('year')}-${part('month')}-${part('day')}`;
    } else {
      if (typeof value !== 'string') {
        throw new DomainError('date', 'INVALID_TYPE', 'A data deve ser informada no formato AAAA-MM-DD.');
      }
      day = value;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      throw new DomainError('date', 'INVALID_FORMAT', 'Informe uma data válida no formato AAAA-MM-DD.');
    }

    const [year, month, dayOfMonth] = day.split('-').map(Number);
    const validDate = new Date(Date.UTC(year, month - 1, dayOfMonth));
    if (
      year < 1000 ||
      validDate.getUTCFullYear() !== year ||
      validDate.getUTCMonth() !== month - 1 ||
      validDate.getUTCDate() !== dayOfMonth
    ) {
      throw new DomainError('date', 'INVALID_FORMAT', 'A data informada não existe.');
    }

    const start = new Date(Date.UTC(year, month - 1, dayOfMonth, OFFSET_HOURS));
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    return new OrderDateRange(start, end);
  }

  public getValue(): { start: Date; end: Date } {
    return { start: new Date(this.start), end: new Date(this.end) };
  }
}
