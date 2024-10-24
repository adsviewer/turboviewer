import { describe, it } from 'node:test';
import * as assert from 'node:assert';
// import { Tier } from '@repo/database';
import { Tier } from '@repo/database';
import { logger } from '@repo/logger';
import { splitTimeRange, timeRangesHelper } from '../src/date-utils';

void describe('splitTimeRange tests', () => {
  void it('less than threshold, one range', () => {
    const ranges = splitTimeRange(new Date('2021-01-01T00:00:00Z'), new Date('2021-01-05T00:00:00Z'));
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-01-05T00:00:00.000Z');
  });

  void it('exactly on the threshold start of day, one range', () => {
    const ranges = splitTimeRange(new Date('2021-01-01T00:00:00Z'), new Date('2021-01-10T00:00:00Z'));
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-01-10T00:00:00.000Z');
  });

  void it('exactly on the threshold end of day, one range', () => {
    const ranges = splitTimeRange(new Date('2021-01-01T00:00:00Z'), new Date('2021-01-10T23:59:00Z'));
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-01-10T23:59:00.000Z');
  });

  void it('one day over threshold, two ranges', () => {
    const ranges = splitTimeRange(new Date('2021-01-01T00:00:00Z'), new Date('2021-04-02T00:00:00Z'));
    assert.strictEqual(ranges.length, 2);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-03-31T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2021-04-01T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2021-04-02T00:00:00.000Z');
  });

  void it('just before three ranges, two ranges', () => {
    const ranges = splitTimeRange(new Date('2021-01-01T00:00:00Z'), new Date('2021-06-29T23:59:00Z'));
    assert.strictEqual(ranges.length, 2);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-03-31T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2021-04-01T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2021-06-29T23:59:00.000Z');
  });

  void it('just over three ranges, three ranges', () => {
    const ranges = splitTimeRange(new Date('2021-01-01T00:00:00Z'), new Date('2021-07-01T00:00:00Z'));

    assert.strictEqual(ranges.length, 3);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-03-31T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2021-04-01T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2021-06-29T00:00:00.000Z');
    assert.strictEqual(ranges[2].since.toISOString(), '2021-06-30T00:00:00.000Z');
    assert.strictEqual(ranges[2].until.toISOString(), '2021-07-01T00:00:00.000Z');
  });

  void it('random over three ranges, three ranges', () => {
    const ranges = splitTimeRange(new Date('2021-01-01T00:00:00Z'), new Date('2021-09-25T00:00:00Z'));
    assert.strictEqual(ranges.length, 3);
    assert.strictEqual(ranges[0].since.toISOString(), '2021-01-01T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2021-03-31T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2021-04-01T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2021-06-29T00:00:00.000Z');
    assert.strictEqual(ranges[2].since.toISOString(), '2021-06-30T00:00:00.000Z');
    assert.strictEqual(ranges[2].until.toISOString(), '2021-09-25T00:00:00.000Z');
  });

  void it('returns split time range when passed with false initial', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-25T18:30:00.000Z') });

    const dummyInsight = { date: new Date('2024-06-25T18:30:00.000Z') };
    const organizations = [{ tier: Tier.Build }, { tier: Tier.Launch }];

    const ranges = timeRangesHelper(false, organizations, dummyInsight);
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2024-06-24T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2024-06-26T18:30:00.000Z');
  });

  void it('returns split time range when passed with true initial', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-26T00:00:00.000Z') });

    const dummyInsight = { date: new Date('2024-06-25T18:30:00.000Z') };
    const organizations = [{ tier: Tier.Launch }, { tier: Tier.Build }];

    const ranges = timeRangesHelper(true, organizations, dummyInsight);
    logger.info(ranges);
    assert.strictEqual(ranges.length, 2);
    assert.strictEqual(ranges[0].since.toISOString(), '2024-03-27T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2024-06-24T00:00:00.000Z');
    assert.strictEqual(ranges[1].since.toISOString(), '2024-06-25T00:00:00.000Z');
    assert.strictEqual(ranges[1].until.toISOString(), '2024-06-27T00:00:00.000Z');
  });

  void it('returns correct time range when last insight was 3 months ago and tier is Launch', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-25T00:00:00.000Z') });

    const dummyInsight = { date: new Date('2024-03-25T18:30:00.000Z') };
    const organizations = [{ tier: Tier.Launch }];

    const ranges = timeRangesHelper(true, organizations, dummyInsight);
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2024-06-17T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2024-06-26T00:00:00.000Z');
  });

  void it('returns correct time range when last insight was 3 months ago and tier is Launch and false initial', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-25T00:00:00.000Z') });

    const dummyInsight = { date: new Date('2024-03-25T18:30:00.000Z') };
    const organizations = [{ tier: Tier.Launch }];

    const ranges = timeRangesHelper(false, organizations, dummyInsight);
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2024-06-17T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2024-06-26T00:00:00.000Z');
  });

  void it('returns correct time range when there is no lastInsight and tier is Launch and false initial', (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-25T00:00:00.000Z') });

    const organizations = [{ tier: Tier.Launch }];

    const ranges = timeRangesHelper(false, organizations, null);
    assert.strictEqual(ranges.length, 1);
    assert.strictEqual(ranges[0].since.toISOString(), '2024-06-17T00:00:00.000Z');
    assert.strictEqual(ranges[0].until.toISOString(), '2024-06-26T00:00:00.000Z');
  });
});
