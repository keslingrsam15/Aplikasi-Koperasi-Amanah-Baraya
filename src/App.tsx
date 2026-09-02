import React, { useState, useEffect } from 'react';
import {
  Product,
  Transaction,
  StockMutation,
  UserProfile,
  CoopConfig,
  Member,
  SavingsRecord,
  LoanRecord,
} from './types';
import {
  initialProducts,
  initialTransactions,
  initialMutations,
  initialUsers,
  initialCoopConfig,
  initialMembers,
  initialSavings,
  initialLoans,
} from './data/initialData';
import {
  fetchProductsFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  fetchTransactionsFromSupabase,
  saveTransactionToSupabase,
  fetchMutationsFromSupabase,
  saveMutationToSupabase,
  fetchUsersFromSupabase,
  saveUserToSupabase,
  deleteUserFromSupabase,
  fetchConfigFromSupabase,
  saveConfigToSupabase,
  fetchMembersFromSupabase,
  saveMemberToSupabase,
  deleteMemberFromSupabase,
  fetchSavingsFromSupabase,
  saveSavingsToSupabase,
  fetchLoansFromSupabase,
  saveLoanToSupabase,
  getSupabaseClient,
} from './services/supabase';
import { Sidebar } from './components/Navigation/Sidebar';
import { TopHeader } from './components/Navigation/TopHeader';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { PosScreen } from './components/Cashier/PosScreen';
import { ProductList } from './components/MasterBarang/ProductList';
import { StockManagement } from './components/Stock/StockManagement';
import { MemberList } from './components/Members/MemberList';
import { SimpanPinjamScreen } from './components/SimpanPinjam/SimpanPinjamScreen';
import { ReportsScreen } from './components/Reports/ReportsScreen';
import { UserManagement } from './components/UserManagement/UserManagement';
import { CoopSettings } from './components/Settings/CoopSettings';
import { QuickProductLookupModal } from './components/Scanner/QuickProductLookupModal';
import { ReceiptModal } from './components/Cashier/ReceiptModal';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { AccountSelectionScreen } from './components/Auth/AccountSelectionScreen';
import { ShoppingCart, PackagePlus } from 'lucide-react';

const STORAGE_KEYS = {
  PRODUCTS: 'koperasi_rsud_products_v3',
  TRANSACTIONS: 'koperasi_rsud_transactions_v3',
  MUTATIONS: 'koperasi_rsud_mutations_v3',
  USERS: 'koperasi_rsud_users_v3',
  CONFIG: 'koperasi_rsud_config_v3',
  CURRENT_USER_ID: 'koperasi_rsud_current_user_id_v3',
  MEMBERS: 'koperasi_rsud_members_v3',
  SAVINGS: 'koperasi_rsud_savings_v3',
  LOANS: 'koperasi_rsud_loans_v3',
};

const getPageHeaderTitle = (tab: string): string => {
  switch (tab) {
    case 'dashboard':
      return 'DASHBOARD KOPERASI AMANAH BARAYA';
    case 'pos':
      return 'KASIR / PENJUALAN KOPERASI AMANAH BARAYA';
    case 'products':
      return 'PRODUK KOPERASI AMANAH BARAYA';
    case 'stock':
      return 'STOK & MUTASI KOPERASI AMANAH BARAYA';
    case 'members':
      return 'DATA ANGGOTA KOPERASI AMANAH BARAYA';
    case 'simpanpinjam':
      return 'SIMPAN PINJAM KOPERASI AMANAH BARAYA';
    case 'reports':
      return 'LAPORAN PENJUALAN & KEUANGAN KOPERASI AMANAH BARAYA';
    case 'users':
      return 'MANAJEMEN PENGGUNA KOPERASI AMANAH BARAYA';
    case 'settings':
      return 'PENGATURAN KOPERASI AMANAH BARAYA';
    default:
      return 'KOPERASI AMANAH BARAYA';
  }
};

export function App() {
  // 1. Products State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
      return initialProducts;
    } catch {
      return initialProducts;
    }
  });

  // 2. Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  // 3. Mutations State
  const [mutations, setMutations] = useState<StockMutation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MUTATIONS);
      return saved ? JSON.parse(saved) : initialMutations;
    } catch {
      return initialMutations;
    }
  });

  // 4. Users State
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  // 5. Coop Config State
  const [coopConfig, setCoopConfig] = useState<CoopConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && /karyawan/i.test(parsed.name)) {
          parsed.name = parsed.name.replace(/karyawan\s*/gi, '').replace(/\s+/g, ' ').trim();
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(parsed));
        }
        return parsed;
      }
      return initialCoopConfig;
    } catch {
      return initialCoopConfig;
    }
  });

  // 6. Current Active User
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const matched = users.find((u) => u.id === savedId);
      return matched || users[0] || initialUsers[0];
    } catch {
      return initialUsers[0];
    }
  });

  // 7. Cooperative Members State
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return saved ? JSON.parse(saved) : initialMembers;
    } catch {
      return initialMembers;
    }
  });

  // 8. Savings Records State
  const [savingsRecords, setSavingsRecords] = useState<SavingsRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVINGS);
      return saved ? JSON.parse(saved) : initialSavings;
    } catch {
      return initialSavings;
    }
  });

  // 9. Loans Records State
  const [loans, setLoans] = useState<LoanRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      return saved ? JSON.parse(saved) : initialLoans;
    } catch {
      return initialLoans;
    }
  });

  // Navigation & Modal states
  const [appStage, setAppStage] = useState<'welcome' | 'select-account' | 'main'>('welcome');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isQuickLookupOpen, setIsQuickLookupOpen] = useState<boolean>(false);
  const [viewingReceiptTrx, setViewingReceiptTrx] = useState<Transaction | null>(null);
  const [addProductSignal, setAddProductSignal] = useState<number>(0);

  // Deep linking for Simpan Pinjam tab
  const [simpanPinjamInitialTab, setSimpanPinjamInitialTab] = useState<'savings' | 'loans'>('savings');
  const [simpanPinjamSelectedMember, setSimpanPinjamSelectedMember] = useState<Member | null>(null);
  const [simpanPinjamSavingsAction, setSimpanPinjamSavingsAction] = useState<'setor' | 'tarik' | null>(null);
  const [simpanPinjamLoanToPay, setSimpanPinjamLoanToPay] = useState<LoanRecord | null>(null);

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => {
    return getSupabaseClient() !== null;
  });

  // Initial cloud sync from Supabase if connected
  useEffect(() => {
    const initCloudSync = async () => {
      const client = getSupabaseClient();
      if (!client) {
        setIsCloudConnected(false);
        return;
      }

      setIsCloudConnected(true);

      try {
        const [
          cloudProducts,
          cloudTrx,
          cloudMutations,
          cloudUsers,
          cloudConfig,
          cloudMembers,
          cloudSavings,
          cloudLoans,
        ] = await Promise.all([
          fetchProductsFromSupabase(),
          fetchTransactionsFromSupabase(),
          fetchMutationsFromSupabase(),
          fetchUsersFromSupabase(),
          fetchConfigFromSupabase(),
          fetchMembersFromSupabase(),
          fetchSavingsFromSupabase(),
          fetchLoansFromSupabase(),
        ]);

        if (cloudProducts !== null) {
          if (cloudProducts.length > 0) {
            setProducts(cloudProducts);
          } else if (products.length > 0) {
            products.forEach((p) => saveProductToSupabase(p));
          }
        }

        if (cloudTrx !== null) {
          if (cloudTrx.length > 0) {
            setTransactions(cloudTrx);
          } else if (transactions.length > 0) {
            transactions.forEach((t) => saveTransactionToSupabase(t));
          }
        }

        if (cloudMutations !== null) {
          if (cloudMutations.length > 0) {
            setMutations(cloudMutations);
          } else if (mutations.length > 0) {
            mutations.forEach((m) => saveMutationToSupabase(m));
          }
        }

        if (cloudUsers !== null) {
          if (cloudUsers.length > 0) {
            setUsers(cloudUsers);
          } else if (users.length > 0) {
            users.forEach((u) => saveUserToSupabase(u));
          }
        }

        if (cloudMembers !== null) {
          if (cloudMembers.length > 0) {
            setMembers(cloudMembers);
          } else if (members.length > 0) {
            members.forEach((mem) => saveMemberToSupabase(mem));
          }
        }

        if (cloudSavings !== null) {
          if (cloudSavings.length > 0) {
            setSavingsRecords(cloudSavings);
          } else if (savingsRecords.length > 0) {
            savingsRecords.forEach((s) => saveSavingsToSupabase(s));
          }
        }

        if (cloudLoans !== null) {
          if (cloudLoans.length > 0) {
            setLoans(cloudLoans);
          } else if (loans.length > 0) {
            loans.forEach((l) => saveLoanToSupabase(l));
          }
        }

        if (cloudConfig !== null) {
          if (cloudConfig.name && /karyawan/i.test(cloudConfig.name)) {
            cloudConfig.name = cloudConfig.name.replace(/karyawan\s*/gi, '').replace(/\s+/g, ' ').trim();
            saveConfigToSupabase(cloudConfig);
          }
          setCoopConfig(cloudConfig);
        } else if (coopConfig) {
          saveConfigToSupabase(coopConfig);
        }
      } catch (err) {
        console.warn('Initial Supabase sync check:', err);
      }
    };

    initCloudSync();
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MUTATIONS, JSON.stringify(mutations));
  }, [mutations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(coopConfig));
  }, [coopConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savingsRecords));
  }, [savingsRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
    }
  }, [currentUser]);

  // Transaction completed in POS
  const handleAddTransaction = (newTrx: Transaction) => {
    setTransactions((prev) => [newTrx, ...prev]);
    saveTransactionToSupabase(newTrx);

    // Automatically deduct stock and record stock mutation logs for each item sold
    const updatedProducts = [...products];
    const newMutations: StockMutation[] = [];

    newTrx.items.forEach((item) => {
      const pIndex = updatedProducts.findIndex((p) => p.id === item.product.id);
      if (pIndex !== -1) {
        const prevStock = updatedProducts[pIndex].stock;
        const newStock = Math.max(0, prevStock - item.quantity);
        const updatedP = {
          ...updatedProducts[pIndex],
          stock: newStock,
          updatedAt: new Date().toISOString(),
        };
        updatedProducts[pIndex] = updatedP;
        saveProductToSupabase(updatedP);

        const mut: StockMutation = {
          id: `MUT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: item.product.id,
          productCode: item.product.code,
          productName: item.product.name,
          type: 'out',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock,
          reason: `Penjualan Kasir (No. ${newTrx.invoiceNumber})`,
          date: newTrx.date,
          operator: newTrx.cashierName,
          referenceNumber: newTrx.invoiceNumber,
        };
        newMutations.push(mut);
        saveMutationToSupabase(mut);
      }
    });

    setProducts(updatedProducts);
    setMutations((prev) => [...newMutations, ...prev]);
  };

  // Master Barang handlers
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    saveProductToSupabase(newProd);

    if (newProd.stock > 0) {
      const mut: StockMutation = {
        id: `MUT-${Date.now()}`,
        productId: newProd.id,
        productCode: newProd.code,
        productName: newProd.name,
        type: 'in',
        quantity: newProd.stock,
        previousStock: 0,
        newStock: newProd.stock,
        reason: 'Pencatatan Stok Awal Master Barang',
        date: new Date().toISOString(),
        operator: currentUser.name,
      };
      setMutations((prev) => [mut, ...prev]);
      saveMutationToSupabase(mut);
    }
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
    saveProductToSupabase(updatedProd);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    deleteProductFromSupabase(productId);
  };

  // Stock mutation handler
  const handleAddStockMutation = (
    mutation: StockMutation,
    updatedProduct: Product
  ) => {
    setMutations((prev) => [mutation, ...prev]);
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    saveMutationToSupabase(mutation);
    saveProductToSupabase(updatedProduct);
  };

  // Member CRUD Handlers
  const handleAddMember = (newMem: Member) => {
    setMembers((prev) => [newMem, ...prev]);
    saveMemberToSupabase(newMem);

    // If initial simpanan pokok > 0, create automatic initial savings record
    if (newMem.simpananPokok > 0) {
      const initialSaving: SavingsRecord = {
        id: `SMP-${Date.now()}`,
        receiptNumber: `SMP-POKOK-${newMem.memberNumber.slice(-4)}`,
        memberId: newMem.id,
        memberNumber: newMem.memberNumber,
        memberName: newMem.name,
        type: 'pokok',
        transactionType: 'setor',
        amount: newMem.simpananPokok,
        date: new Date().toISOString(),
        notes: 'Setoran Simpanan Pokok Awal Pendaftaran Anggota',
        operator: currentUser.name || 'Petugas Koperasi',
      };
      setSavingsRecords((prev) => [initialSaving, ...prev]);
      saveSavingsToSupabase(initialSaving);
    }
  };

  const handleUpdateMember = (updatedMem: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMem.id ? updatedMem : m)));
    saveMemberToSupabase(updatedMem);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    deleteMemberFromSupabase(memberId);
  };

  // Savings Transaction Handler
  const handleAddSavingsTransaction = (recordData: Omit<SavingsRecord, 'id'>) => {
    const newRecord: SavingsRecord = {
      ...recordData,
      id: `SMP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    setSavingsRecords((prev) => [newRecord, ...prev]);
    saveSavingsToSupabase(newRecord);

    // Update member's balance in state & cloud
    setMembers((prev) =>
      prev.map((mem) => {
        if (mem.id !== newRecord.memberId) return mem;

        const delta =
          newRecord.transactionType === 'setor' ? newRecord.amount : -newRecord.amount;
        let updatedMem = { ...mem };

        if (newRecord.type === 'pokok') {
          updatedMem.simpananPokok = Math.max(0, mem.simpananPokok + delta);
        } else if (newRecord.type === 'wajib') {
          updatedMem.simpananWajib = Math.max(0, mem.simpananWajib + delta);
        } else if (newRecord.type === 'sukarela') {
          updatedMem.simpananSukarela = Math.max(0, mem.simpananSukarela + delta);
        }

        saveMemberToSupabase(updatedMem);
        return updatedMem;
      })
    );
  };

  // Loans Handlers
  const handleAddLoan = (newLoan: LoanRecord) => {
    setLoans((prev) => [newLoan, ...prev]);
    saveLoanToSupabase(newLoan);
  };

  const handleUpdateLoan = (updatedLoan: LoanRecord) => {
    setLoans((prev) => prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)));
    saveLoanToSupabase(updatedLoan);
  };

  // Deep linking action helpers from Member Details to Simpan Pinjam
  const handleNavigateToSavings = (member: Member, action: 'setor' | 'tarik') => {
    setSimpanPinjamInitialTab('savings');
    setSimpanPinjamSelectedMember(member);
    setSimpanPinjamSavingsAction(action);
    setActiveTab('simpanpinjam');
  };

  const handleNavigateToLoanApply = (member: Member) => {
    setSimpanPinjamInitialTab('loans');
    setSimpanPinjamSelectedMember(member);
    setActiveTab('simpanpinjam');
  };

  const handleNavigateToPayInstallment = (loan: LoanRecord) => {
    setSimpanPinjamInitialTab('loans');
    setSimpanPinjamLoanToPay(loan);
    setActiveTab('simpanpinjam');
  };

  // User management handlers
  const handleSwitchUser = (u: UserProfile) => {
    setCurrentUser(u);
  };

  const handleAddUser = (u: UserProfile) => {
    setUsers((prev) => [...prev, u]);
    saveUserToSupabase(u);
  };

  const handleUpdateUser = (u: UserProfile) => {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
    if (currentUser.id === u.id) {
      setCurrentUser(u);
    }
    saveUserToSupabase(u);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => {
      const remaining = prev.filter((x) => x.id !== userId);
      if (remaining.length === 0) {
        const fallback: UserProfile = {
          id: `USR-${Date.now()}`,
          name: 'Administrator',
          role: 'admin',
          avatarColor: 'bg-blue-600',
          nipOrNik: '',
          shift: 'Akses Penuh Sistem',
        };
        setCurrentUser(fallback);
        saveUserToSupabase(fallback);
        return [fallback];
      }
      if (currentUser.id === userId) {
        setCurrentUser(remaining[0]);
      }
      return remaining;
    });
    deleteUserFromSupabase(userId);
  };

  // Settings handlers
  const handleSaveConfig = (newCfg: CoopConfig) => {
    setCoopConfig(newCfg);
    saveConfigToSupabase(newCfg);
  };

  const handleRestoreAllData = (backup: any) => {
    if (backup.config) setCoopConfig(backup.config);
    if (backup.products) setProducts(backup.products);
    if (backup.transactions) setTransactions(backup.transactions);
    if (backup.mutations) setMutations(backup.mutations);
    if (backup.members) setMembers(backup.members);
    if (backup.savingsRecords) setSavingsRecords(backup.savingsRecords);
    if (backup.loans) setLoans(backup.loans);
    if (backup.users) {
      setUsers(backup.users);
      if (backup.users[0]) setCurrentUser(backup.users[0]);
    }
  };

  const handleResetToDefault = () => {
    setProducts(initialProducts);
    setTransactions(initialTransactions);
    setMutations(initialMutations);
    setMembers(initialMembers);
    setSavingsRecords(initialSavings);
    setLoans(initialLoans);
    setUsers(initialUsers);
    setCoopConfig(initialCoopConfig);
    setCurrentUser(initialUsers[0]);
  };

  const handleSelectAccount = (user: UserProfile, targetTab?: string) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    if (targetTab) {
      setActiveTab(targetTab);
    } else if (user.role === 'kasir') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
    setAppStage('main');
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // 1. Initial Opening View: Welcome Page (Polos / Custom Wallpaper with "Ayo Belanja" button)
  if (appStage === 'welcome') {
    return (
      <WelcomeScreen
        coopConfig={coopConfig}
        onStartShopping={() => setAppStage('select-account')}
      />
    );
  }

  // 2. Account Selection View: 2 Cards (Administrator & Kasir)
  if (appStage === 'select-account') {
    return (
      <AccountSelectionScreen
        users={users}
        coopConfig={coopConfig}
        onSelectUser={handleSelectAccount}
        onBackToWelcome={() => setAppStage('welcome')}
        isCloudConnected={isCloudConnected}
      />
    );
  }

  // 3. Main Application Workspace (Dashboard, POS, Produk, etc.)
  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-800 overflow-hidden select-none">
      {/* Dark Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        coopConfig={coopConfig}
        lowStockCount={lowStockCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onLogoutOrSwitchScreen={() => setAppStage('select-account')}
        onReturnToWelcome={() => setAppStage('welcome')}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f8fafc]">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenQuickScan={() => setIsQuickLookupOpen(true)}
          onNavigateToPos={() => setActiveTab('pos')}
          coopConfig={coopConfig}
          currentUser={currentUser}
          isCloudConnected={isCloudConnected}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Scrollable Main Content View Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-5 pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header Judul Halaman Menu (Universal di bawah Header Utama) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 mb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight uppercase">
                  {getPageHeaderTitle(activeTab)}
                </h1>
                <p className="text-xs sm:text-sm font-bold text-slate-600 tracking-wide mt-0.5 uppercase">
                  RSUD AL-MULK KOTA SUKABUMI
                </p>
              </div>

              {activeTab === 'products' ? (
                <button
                  id="btn-header-add-product"
                  onClick={() => setAddProductSignal((prev) => prev + 1)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition active:scale-95 self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>Tambah Barang</span>
                </button>
              ) : activeTab !== 'pos' ? (
                <button
                  onClick={() => setActiveTab('pos')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition active:scale-95 self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Transaksi</span>
                </button>
              ) : null}
            </div>

            {/* 1. Dashboard */}
            {activeTab === 'dashboard' && (
              <DashboardOverview
                transactions={transactions}
                products={products}
                mutations={mutations}
                currentUser={currentUser}
                coopConfig={coopConfig}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenQuickScan={() => setIsQuickLookupOpen(true)}
                onViewReceipt={(trx) => setViewingReceiptTrx(trx)}
              />
            )}

            {/* 2. Kasir / POS */}
            {activeTab === 'pos' && (
              <PosScreen
                products={products}
                currentUser={currentUser}
                coopConfig={coopConfig}
                members={members}
                onSaveTransaction={handleAddTransaction}
                transactionsTodayCount={
                  transactions.filter(
                    (t) => new Date(t.date).toDateString() === new Date().toDateString()
                  ).length
                }
              />
            )}

            {/* 3. Produk & Master Barang */}
            {activeTab === 'products' && (
              <ProductList
                products={products}
                coopConfig={coopConfig}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onOpenBarcodeStudio={() => setActiveTab('products')}
                triggerAddSignal={addProductSignal}
              />
            )}

            {/* 4. Stok & Mutasi */}
            {activeTab === 'stock' && (
              <StockManagement
                products={products}
                mutations={mutations}
                currentUser={currentUser}
                onAddStockMutation={handleAddStockMutation}
              />
            )}

            {/* 5. Data Anggota (RSUD) */}
            {activeTab === 'members' && (
              <MemberList
                members={members}
                savingsRecords={savingsRecords}
                loans={loans}
                transactions={transactions}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onNavigateToSavings={handleNavigateToSavings}
                onNavigateToLoanApply={handleNavigateToLoanApply}
                onNavigateToPayInstallment={handleNavigateToPayInstallment}
              />
            )}

            {/* 6. Simpan Pinjam Koperasi */}
            {activeTab === 'simpanpinjam' && (
              <SimpanPinjamScreen
                members={members}
                savingsRecords={savingsRecords}
                loans={loans}
                currentUser={currentUser}
                onAddSavingsTransaction={handleAddSavingsTransaction}
                onAddLoan={handleAddLoan}
                onUpdateLoan={handleUpdateLoan}
                initialTab={simpanPinjamInitialTab}
                initialSelectedMember={simpanPinjamSelectedMember}
                initialSavingsAction={simpanPinjamSavingsAction}
                initialLoanToPay={simpanPinjamLoanToPay}
                onClearInitialAction={() => {
                  setSimpanPinjamSelectedMember(null);
                  setSimpanPinjamSavingsAction(null);
                  setSimpanPinjamLoanToPay(null);
                }}
              />
            )}

            {/* 7. Laporan (Penjualan, SHU, Stok) */}
            {activeTab === 'reports' && (
              <ReportsScreen
                transactions={transactions}
                products={products}
                members={members}
                savingsRecords={savingsRecords}
                loans={loans}
                coopConfig={coopConfig}
              />
            )}

            {/* 8. Data Pengguna */}
            {activeTab === 'users' && (
              <UserManagement
                users={users}
                currentUser={currentUser}
                onSwitchUser={handleSwitchUser}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {/* 9. Pengaturan */}
            {activeTab === 'settings' && (
              <CoopSettings
                config={coopConfig}
                products={products}
                transactions={transactions}
                mutations={mutations}
                users={users}
                onSaveConfig={handleSaveConfig}
                onRestoreAllData={handleRestoreAllData}
                onResetToDefault={handleResetToDefault}
                onPreviewWelcome={() => setAppStage('welcome')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Quick Barcode Lookup Modal */}
      <QuickProductLookupModal
        isOpen={isQuickLookupOpen}
        onClose={() => setIsQuickLookupOpen(false)}
        products={products}
        onAddToCart={(p) => {
          setActiveTab('pos');
        }}
        onPrintBarcode={(p) => {
          setActiveTab('products');
        }}
        onRestock={(p) => {
          setActiveTab('stock');
        }}
      />

      {/* Global Receipt Modal (e.g. from Dashboard or Report click) */}
      <ReceiptModal
        isOpen={!!viewingReceiptTrx}
        onClose={() => setViewingReceiptTrx(null)}
        transaction={viewingReceiptTrx}
        coopConfig={coopConfig}
      />
    </div>
  );
}

export default App;
