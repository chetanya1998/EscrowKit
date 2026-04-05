import { serializePublicResponse } from './serialize-public-response';

describe('serializePublicResponse', () => {
  it('converts bigint values to strings recursively', () => {
    const input = {
      blockNumber: 42n,
      nested: {
        amounts: [1n, 2n],
      },
    };

    expect(serializePublicResponse(input)).toEqual({
      blockNumber: '42',
      nested: {
        amounts: ['1', '2'],
      },
    });
  });

  it('preserves dates and primitive values', () => {
    const date = new Date('2026-04-05T00:00:00.000Z');

    expect(
      serializePublicResponse({
        createdAt: date,
        ok: true,
        note: 'ready',
      }),
    ).toEqual({
      createdAt: date,
      ok: true,
      note: 'ready',
    });
  });
});
