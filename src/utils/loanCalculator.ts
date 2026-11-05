import { LoanRecord } from '../types';

export interface LoanInstallmentProgress {
  tenorMonths: number;
  paidMonths: number;
  remainingMonths: number;
  percentPaid: number;
  isFullyPaid: boolean;
  nextInstallmentNumber: number;
  remainingMonthsLabel: string;
  paidMonthsLabel: string;
}

export function calculateLoanInstallmentProgress(
  loan: Pick<
    LoanRecord,
    'tenorMonths' | 'monthlyInstallment' | 'totalRepayment' | 'totalPaid' | 'remainingAmount' | 'status'
  >
): LoanInstallmentProgress {
  const tenor = Math.max(1, loan.tenorMonths || 1);
  const isFullyPaid =
    loan.status === 'paid' ||
    loan.remainingAmount <= 0 ||
    (loan.totalRepayment > 0 && loan.totalPaid >= loan.totalRepayment);

  if (isFullyPaid) {
    return {
      tenorMonths: tenor,
      paidMonths: tenor,
      remainingMonths: 0,
      percentPaid: 100,
      isFullyPaid: true,
      nextInstallmentNumber: tenor,
      remainingMonthsLabel: 'Angsuran Lunas',
      paidMonthsLabel: `Lunas (${tenor}/${tenor} bln)`,
    };
  }

  const percentPaid =
    loan.totalRepayment > 0
      ? Math.min(99, Math.max(0, Math.round((loan.totalPaid / loan.totalRepayment) * 100)))
      : 0;

  let paidMonths = 0;
  if (loan.totalPaid > 0 && loan.monthlyInstallment > 0) {
    // Allow small tolerance (Rp 100) for rounding differences on monthly installments
    paidMonths = Math.floor((loan.totalPaid + 100) / loan.monthlyInstallment);
    paidMonths = Math.min(tenor - 1, Math.max(0, paidMonths));
  }

  const remainingMonths = Math.max(1, tenor - paidMonths);
  const nextInstallmentNumber = Math.min(tenor, paidMonths + 1);

  const remainingMonthsLabel = `Sisa ${remainingMonths} bulan lagi`;
  const paidMonthsLabel =
    paidMonths > 0
      ? `Terbayar ${paidMonths} dari ${tenor} bln`
      : `Belum angsur (0/${tenor} bln)`;

  return {
    tenorMonths: tenor,
    paidMonths,
    remainingMonths,
    percentPaid,
    isFullyPaid: false,
    nextInstallmentNumber,
    remainingMonthsLabel,
    paidMonthsLabel,
  };
}
