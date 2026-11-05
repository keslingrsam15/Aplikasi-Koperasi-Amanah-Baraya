import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLoanInstallmentProgress } from './loanCalculator';

test('new 12-month loan with 0 payment shows 12 months remaining', () => {
  const progress = calculateLoanInstallmentProgress({
    tenorMonths: 12,
    monthlyInstallment: 491667,
    totalRepayment: 5900004,
    totalPaid: 0,
    remainingAmount: 5900004,
    status: 'active',
  });

  assert.equal(progress.paidMonths, 0);
  assert.equal(progress.remainingMonths, 12);
  assert.equal(progress.percentPaid, 0);
  assert.equal(progress.isFullyPaid, false);
  assert.equal(progress.remainingMonthsLabel, 'Sisa 12 bulan lagi');
  assert.equal(progress.nextInstallmentNumber, 1);
});

test('12-month loan after paying 1 month shows Sisa 11 bulan lagi', () => {
  const progress = calculateLoanInstallmentProgress({
    tenorMonths: 12,
    monthlyInstallment: 491667,
    totalRepayment: 5900004,
    totalPaid: 491667,
    remainingAmount: 5408337,
    status: 'active',
  });

  assert.equal(progress.paidMonths, 1);
  assert.equal(progress.remainingMonths, 11);
  assert.equal(progress.percentPaid, 8);
  assert.equal(progress.isFullyPaid, false);
  assert.equal(progress.remainingMonthsLabel, 'Sisa 11 bulan lagi');
  assert.equal(progress.paidMonthsLabel, 'Terbayar 1 dari 12 bln');
  assert.equal(progress.nextInstallmentNumber, 2);
});

test('12-month loan decrements remaining months sequentially from 11 down to 1', () => {
  const monthly = 491667;
  const total = monthly * 12;

  for (let m = 1; m <= 11; m++) {
    const paid = monthly * m;
    const rem = total - paid;
    const progress = calculateLoanInstallmentProgress({
      tenorMonths: 12,
      monthlyInstallment: monthly,
      totalRepayment: total,
      totalPaid: paid,
      remainingAmount: rem,
      status: 'active',
    });

    assert.equal(progress.paidMonths, m);
    assert.equal(progress.remainingMonths, 12 - m);
    assert.equal(progress.remainingMonthsLabel, `Sisa ${12 - m} bulan lagi`);
  }
});

test('12-month loan when fully paid shows Angsuran Lunas and 0 remaining months', () => {
  const progress = calculateLoanInstallmentProgress({
    tenorMonths: 12,
    monthlyInstallment: 491667,
    totalRepayment: 5900004,
    totalPaid: 5900004,
    remainingAmount: 0,
    status: 'paid',
  });

  assert.equal(progress.paidMonths, 12);
  assert.equal(progress.remainingMonths, 0);
  assert.equal(progress.percentPaid, 100);
  assert.equal(progress.isFullyPaid, true);
  assert.equal(progress.remainingMonthsLabel, 'Angsuran Lunas');
});
