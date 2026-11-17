import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMemberSavingsBreakdown,
  getMemberTotalSavings,
  getAllMembersSavingsSummary,
} from './savingsCalculator';
import { Member } from '../types';

describe('savingsCalculator (integrasi kumulatif simpanan pokok, wajib, sukarela, karyawisata)', () => {
  it('sums pokok, wajib, sukarela, and simpananWisata (karyawisata) accurately for a member', () => {
    const member: Pick<
      Member,
      'simpananPokok' | 'simpananWajib' | 'simpananSukarela' | 'simpananWisata'
    > = {
      simpananPokok: 200000,
      simpananWajib: 1732000,
      simpananSukarela: 300000,
      simpananWisata: 250000,
    };

    const breakdown = getMemberSavingsBreakdown(member);
    assert.equal(breakdown.pokok, 200000);
    assert.equal(breakdown.wajib, 1732000);
    assert.equal(breakdown.sukarela, 300000);
    assert.equal(breakdown.wisata, 250000);
    assert.equal(breakdown.total, 2482000);
    assert.equal(getMemberTotalSavings(member), 2482000);
  });

  it('handles undefined simpananWisata gracefully as 0 without NaN', () => {
    const member: Pick<
      Member,
      'simpananPokok' | 'simpananWajib' | 'simpananSukarela' | 'simpananWisata'
    > = {
      simpananPokok: 200000,
      simpananWajib: 1732000,
      simpananSukarela: 300000,
      simpananWisata: undefined,
    };

    assert.equal(getMemberTotalSavings(member), 2232000);
  });

  it('computes cumulative summary and average across all members including simpananWisata', () => {
    const members = [
      {
        simpananPokok: 200000,
        simpananWajib: 1732000,
        simpananSukarela: 300000,
        simpananWisata: 250000,
      },
      {
        simpananPokok: 200000,
        simpananWajib: 500000,
        simpananSukarela: 100000,
        simpananWisata: 150000,
      },
    ];

    const summary = getAllMembersSavingsSummary(members);
    assert.equal(summary.totalPokok, 400000);
    assert.equal(summary.totalWajib, 2232000);
    assert.equal(summary.totalSukarela, 400000);
    assert.equal(summary.totalWisata, 400000);
    assert.equal(summary.totalAllSavings, 3432000);
    assert.equal(summary.avgSavings, 1716000);
  });
});
