import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListPendingOrders } from '../../../../../src/application/use-cases/orders/list-pending-orders.js';
import { ListPreparingOrders } from '../../../../../src/application/use-cases/orders/list-preparing-orders.js';
import { ListOrderHistory } from '../../../../../src/application/use-cases/orders/list-order-history.js';
import type { OrderQueries } from '../../../../../src/application/queries/order-queries.js';
import { OrderDateRange } from '../../../../../src/domain/value-objects/order/order-date-range.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';

for (const [UseCase, method, status] of [
  [ListPendingOrders, 'findPending', 'PENDING'], [ListPreparingOrders, 'findPreparing', 'PREPARING'], [ListOrderHistory, 'findHistory', 'COMPLETED'],
] as const) {
  describe(UseCase.name, () => {
    it('returns query results unchanged and filters the requested local day', async (context) => {
      const result = [{
        id: 'order-1', customerName: 'Maria', customerPhone: '11999999999', observation: 'Sem cebola',
        tableId: null, tableNumber: null, status, total: '9007199254740993.01',
        createdAt: '2026-10-27T12:00:00Z', updatedAt: '2026-10-27T12:00:00Z',
        items: [], histories: [],
      }];
      const query = context.mock.fn(async (_range?: OrderDateRange) => result);
      const useCase = new UseCase({ [method]: query } as unknown as OrderQueries);
      assert.strictEqual(await useCase.list({ date: '2028-02-29' }), result);
      assert.equal(query.mock.callCount(), 1);
      assert.deepEqual(query.mock.calls[0].arguments[0]?.getValue(), {
        start: new Date('2028-02-29T03:00:00Z'), end: new Date('2028-03-01T03:00:00Z'),
      });
    });

    it('defaults to the current local day when the date is omitted', async (context) => {
      context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-01T02:59:59Z') });
      const query = context.mock.fn(async (_range?: OrderDateRange) => []);
      await new UseCase({ [method]: query } as unknown as OrderQueries).list({});
      assert.deepEqual(query.mock.calls[0].arguments[0]?.getValue(), {
        start: new Date('2025-12-31T03:00:00Z'), end: new Date('2026-01-01T03:00:00Z'),
      });
    });

    for (const date of [null, 42, [], '', '2026-02-30', '2026-00-01', '0999-01-01']) {
      it(`rejects invalid date ${JSON.stringify(date)} without querying`, async (context) => {
        const query = context.mock.fn(async () => []);
        await assert.rejects(new UseCase({ [method]: query } as unknown as OrderQueries).list({ date }),
          (error: unknown) => error instanceof DomainError && error.field === 'date');
        assert.equal(query.mock.callCount(), 0);
      });
    }

    it('propagates query errors unchanged', async () => {
      const failure = new Error('Query unavailable');
      const queries = { [method]: async () => { throw failure; } } as unknown as OrderQueries;
      await assert.rejects(new UseCase(queries).list({ date: '2026-10-27' }), (error: unknown) => error === failure);
    });
  });
}
