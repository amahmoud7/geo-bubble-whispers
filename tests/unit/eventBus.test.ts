import { describe, expect, it } from 'vitest';
import { eventBus } from '@/utils/eventBus';

describe('eventBus', () => {
  it('supports publish/subscribe semantics', () => {
    let payload: { id: string } | null = null;
    const unsubscribe = eventBus.on('messageCreated', (detail) => {
      payload = detail;
    });

    eventBus.emit('messageCreated', { id: '42' });
    unsubscribe();

    expect(payload).toEqual({ id: '42' });
  });
});
