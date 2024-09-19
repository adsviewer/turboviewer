import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { splitTimeRange } from '../src/date-utils';

void describe('splitTimeRange tests', () => {
  const maxTimePeriodDays = 90;

  void it('less than threshold, one range', () => {
    const ranges = splitTimeRange(
      maxTimePeriodDays,
      new Date('2021-01-01T00:00:00Z'),
      new Date('2021-01-05T00:00:00Z'),
    );
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-01-05T00:00:00.000Z');
  });

  void it('exactly on the threshold start of day, one range', () => {
    const ranges = splitTimeRange(
      maxTimePeriodDays,
      new Date('2021-01-01T00:00:00Z'),
      new Date('2021-01-10T00:00:00Z'),
    );
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-01-10T00:00:00.000Z');
  });

  void it('exactly on the threshold end of day, one range', () => {
    const ranges = splitTimeRange(
      maxTimePeriodDays,
      new Date('2021-01-01T00:00:00Z'),
      new Date('2021-01-10T23:59:00Z'),
    );
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-01-10T23:59:00.000Z');
  });

  void it('one day over threshold, two ranges', () => {
    const ranges = splitTimeRange(
      maxTimePeriodDays,
      new Date('2021-01-01T00:00:00Z'),
      new Date('2021-04-01T00:00:00Z'),
    );
    assert.strictEqual(ranges.length, 2);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-03-31T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2021-04-01T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2021-04-01T00:00:00.000Z');
  });

  void it('just before three ranges, two ranges', () => {
    const ranges = splitTimeRange(
      maxTimePeriodDays,
      new Date('2021-01-01T00:00:00Z'),
      new Date('2021-06-29T23:59:00Z'),
    );
    assert.strictEqual(ranges.length, 2);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-03-31T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2021-04-01T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2021-06-29T23:59:00.000Z');
  });

  void it('just over three ranges, three ranges', () => {
    const ranges = splitTimeRange(
      maxTimePeriodDays,
      new Date('2021-01-01T00:00:00Z'),
      new Date('2021-06-30T00:00:00Z'),
    );
    assert.strictEqual(ranges.length, 3);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-03-31T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2021-04-01T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2021-06-29T00:00:00.000Z');
    assert.strictEqual(ranges[2].since.toISOString(), '2021-06-30T00:00:00.000Z');
    assert.strictEqual(ranges[2].until.toISOString(), '2021-06-30T00:00:00.000Z');
  });

  void it('random over three ranges, three ranges', () => {
    const ranges = splitTimeRange(
      maxTimePeriodDays,
      new Date('2021-01-01T00:00:00Z'),
      new Date('2021-09-25T00:00:00Z'),
    );
    assert.strictEqual(ranges.length, 3);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-03-31T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2021-04-01T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2021-06-29T00:00:00.000Z');
    assert.strictEqual(ranges[2].since.toISOString(), '2021-06-30T00:00:00.000Z');
    assert.strictEqual(ranges[2].until.toISOString(), '2021-09-25T00:00:00.000Z');
  });
});
