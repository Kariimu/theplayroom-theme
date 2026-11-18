import { describe, it, expect } from 'vitest';
import { scalar, toIds } from '../../app/lib/pickerValue';

describe('scalar', () => {
  it('passes through a plain string or number', () => {
    expect(scalar('category')).toBe('category');
    expect(scalar(5)).toBe('5');
  });

  it('unwraps a hydrated picker object by value, key, then id', () => {
    expect(scalar({ value: 'tag' })).toBe('tag');
    expect(scalar({ key: 'tag' })).toBe('tag');
    expect(scalar({ id: 42 })).toBe('42');
  });

  it('takes the first entry of an array', () => {
    expect(scalar(['a', 'b'])).toBe('a');
  });

  it('is empty for null/undefined', () => {
    expect(scalar(null)).toBe('');
    expect(scalar(undefined)).toBe('');
  });
});

describe('toIds', () => {
  it('reads ids off an array of scalars', () => {
    expect(toIds([1, '2', 3])).toEqual([1, 2, 3]);
  });

  it('reads ids off an array of hydrated objects', () => {
    expect(toIds([{ id: 10 }, { value: 20 }])).toEqual([10, 20]);
  });

  it('wraps a single scalar', () => {
    expect(toIds(5)).toEqual([5]);
  });

  it('unwraps a { source_value } wrapper', () => {
    expect(toIds({ source_value: [1, 2] })).toEqual([1, 2]);
  });

  it('drops non-positive and non-finite ids', () => {
    expect(toIds([0, -1, 'abc', 3])).toEqual([3]);
  });

  it('is empty for null/undefined/empty string', () => {
    expect(toIds(null)).toEqual([]);
    expect(toIds(undefined)).toEqual([]);
    expect(toIds('')).toEqual([]);
  });
});
