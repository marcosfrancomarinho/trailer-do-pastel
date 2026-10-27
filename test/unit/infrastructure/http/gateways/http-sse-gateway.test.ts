import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import type { Response } from 'express';
import { describe, it, type TestContext } from 'node:test';
import { HttpSseGateway } from '../../../../../src/infrastructure/http/gateways/http-sse-gateway.js';

function createClient(context: TestContext) {
  const response = Object.assign(new EventEmitter(), {
    destroyed: false,
    writableEnded: false,
    status: context.mock.fn((_status: number) => {}),
    set: context.mock.fn((_headers: Record<string, string>) => {}),
    flushHeaders: context.mock.fn(() => {}),
    write: context.mock.fn((_message: string) => true),
    destroy: context.mock.fn(() => { response.destroyed = true; }),
  });
  context.after(() => { response.emit('close'); });
  return { response, client: response as unknown as Response };
}

describe('HttpSseGateway', () => {
  it('opens an SSE stream and broadcasts JSON events to connected clients', context => {
    const gateway = new HttpSseGateway();
    const first = createClient(context);
    const second = createClient(context);
    gateway.connect(first.client);
    gateway.connect(second.client);

    assert.deepEqual(first.response.status.mock.calls[0].arguments, [200]);
    assert.deepEqual(first.response.set.mock.calls[0].arguments, [{
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    }]);
    assert.equal(first.response.flushHeaders.mock.callCount(), 1);

    gateway.send({ orderId: 'order-1', status: 'PENDING' });
    for (const { response } of [first, second]) {
      assert.deepEqual(response.write.mock.calls.map(call => call.arguments[0]), [
        ': connected\n\n', 'data: {"orderId":"order-1","status":"PENDING"}\n\n',
      ]);
    }
  });

  it('stops sending after a client disconnects', context => {
    const gateway = new HttpSseGateway();
    const { response, client } = createClient(context);
    gateway.connect(client);
    response.emit('close');
    gateway.send({ orderId: 'order-1' });
    assert.equal(response.write.mock.callCount(), 1);
  });

  it('isolates write failures and continues notifying other clients', context => {
    const gateway = new HttpSseGateway();
    const broken = createClient(context);
    const healthy = createClient(context);
    gateway.connect(broken.client);
    gateway.connect(healthy.client);
    broken.response.write.mock.mockImplementation(() => { throw new Error('Disconnected'); });

    assert.doesNotThrow(() => gateway.send({ orderId: 'order-1' }));
    gateway.send({ orderId: 'order-2' });
    assert.equal(broken.response.destroy.mock.callCount(), 1);
    assert.equal(broken.response.write.mock.callCount(), 2);
    assert.equal(healthy.response.write.mock.callCount(), 3);
  });

  it('disconnects slow clients instead of accumulating an unbounded event buffer', context => {
    const gateway = new HttpSseGateway();
    const { response, client } = createClient(context);
    gateway.connect(client);
    response.write.mock.mockImplementation(() => false);
    gateway.send({ orderId: 'order-1' });
    gateway.send({ orderId: 'order-2' });
    assert.equal(response.destroy.mock.callCount(), 1);
    assert.equal(response.write.mock.callCount(), 2);
  });
  it('sends customer notifications exclusively to the matching order stream', context => {
    const gateway = new HttpSseGateway();
    const staff = createClient(context);
    const customerOne = createClient(context);
    const customerTwo = createClient(context);
    gateway.connect(staff.client);
    gateway.connect(customerOne.client, 'order-1');
    gateway.connect(customerTwo.client, 'order-2');

    gateway.send({ orderId: 'order-1', status: 'COMPLETED' });

    assert.equal(staff.response.write.mock.callCount(), 2);
    assert.equal(customerOne.response.write.mock.callCount(), 2);
    assert.equal(customerTwo.response.write.mock.callCount(), 1);
  });

});
