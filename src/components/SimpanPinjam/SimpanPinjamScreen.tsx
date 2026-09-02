import React, { useState } from 'react';
import { Member, SavingsRecord, LoanRecord, UserProfile } from '../../types';
import { SavingsManagement } from './SavingsManagement';
import { LoanManagement } from './LoanManagement';
import { Landmark, PiggyBank, CreditCard, Users, PlusCircle, ArrowRightLeft } from 'lucide-react';

interface SimpanPinjamScreenProps {
  members: Member[];
  savingsRecords: SavingsRecord[];
  loans: LoanRecord[];
  currentUser: UserProfile;
  onAddSavingsTransaction: (record: Omit<SavingsRecord, 'id'>) => void;
  onAddLoan: (loan: LoanRecord) => void;
  onUpdateLoan: (loan: LoanRecord) => void;
  initialTab?: 'savings' | 'loans';
  initialSelectedMember?: Member | null;
  initialSavingsAction?: 'setor' | 'tarik' | null;
  initialLoanToPay?: LoanRecord | null;
  onClearInitialAction?: () => void;
}

export const SimpanPinjamScreen: React.FC<SimpanPinjamScreenProps> = ({
  members,
  savingsRecords,
  loans,
  currentUser,
  onAddSavingsTransaction,
  onAddLoan,
  onUpdateLoan,
  initialTab = 'savings',
  initialSelectedMember,
  initialSavingsAction,
  initialLoanToPay,
  onClearInitialAction,
}) => {
  const [activeTab, setActiveTab] = useState<'savings' | 'loans'>(initialTab);

  // Total summary for header badges
  const totalAllSavings = members.reduce(
    (sum, m) => sum + (m.simpananPokok + m.simpananWajib + m.simpananSukarela),
    0
  );
  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalSisaPinjaman = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Unit Simpan Pinjam Koperasi
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola simpanan pokok/wajib/sukarela, pengajuan pinjaman, dan pemantauan angsuran anggota
            </p>
          </div>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('savings')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'savings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            <span>Simpanan Anggota</span>
          </button>

          <button
            onClick={() => setActiveTab('loans')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'loans'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pinjaman & Angsuran</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'savings' ? (
        <SavingsManagement
          members={members}
          savingsRecords={savingsRecords}
          onAddSavingsTransaction={onAddSavingsTransaction}
          currentUser={currentUser}
          initialSelectedMember={initialSelectedMember}
          initialAction={initialSavingsAction}
          onClearInitialAction={onClearInitialAction}
        />
      ) : (
        <LoanManagement
          members={members}
          loans={loans}
          onAddLoan={onAddLoan}
          onUpdateLoan={onUpdateLoan}
          currentUser={currentUser}
          initialSelectedMember={initialSelectedMember}
          initialLoanToPay={initialLoanToPay}
          onClearInitialAction={onClearInitialAction}
        />
      )}
    </div>
  );
};
