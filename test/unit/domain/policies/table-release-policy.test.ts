import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TableReleasePolicy } from '../../../../src/domain/policies/table-release-policy.js';

describe('TableReleasePolicy', () => {
  for (const hasActiveOrders of [false, true]) {
    for (const openSessionId of [null, 'session-1']) {
      it(`rejects an already free table (active orders: ${hasActiveOrders}, session: ${openSessionId})`, () => {
        assert.deepEqual(TableReleasePolicy.evaluate({ status: 'FREE', hasActiveOrders, openSessionId }), {
          allowed: false, code: 'UNAVAILABLE', message: 'A mesa já está livre.',
        });
      });
    }
  }

  for (const openSessionId of [null, 'session-1']) {
    it(`rejects an occupied table with active orders even when session is ${openSessionId}`, () => {
      assert.deepEqual(TableReleasePolicy.evaluate({ status: 'OCCUPIED', hasActiveOrders: true, openSessionId }), {
        allowed: false, code: 'IN_USE', message: 'A mesa possui pedidos em andamento.',
      });
    });
  }

  it('rejects an occupied table without an open session even after all orders are finalized', () => {
    assert.deepEqual(TableReleasePolicy.evaluate({ status: 'OCCUPIED', hasActiveOrders: false, openSessionId: null }), {
      allowed: false, code: 'IN_USE', message: 'A mesa ocupada não possui uma comanda aberta.',
    });
  });

  it('allows releasing an occupied table with an open session and no active orders', () => {
    const state = { status: 'OCCUPIED' as const, hasActiveOrders: false, openSessionId: 'session-1' };
    assert.deepEqual(TableReleasePolicy.evaluate(state), { allowed: true, sessionId: 'session-1' });
    assert.deepEqual(state, { status: 'OCCUPIED', hasActiveOrders: false, openSessionId: 'session-1' });
  });
});
