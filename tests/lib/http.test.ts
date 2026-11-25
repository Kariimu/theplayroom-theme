import { describe, it, expect } from 'vitest';
import { isNotFound } from '../../app/lib/http';

describe('isNotFound', () => {
  it('is true only for an error answered 404', () => {
    expect(isNotFound({ response: { status: 404 } })).toBe(true);
    for (const error of [{ response: { status: 500 } }, new Error('network'), null, undefined]) {
      expect(isNotFound(error)).toBe(false);
    }
  });
});
