import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  Transaction,
  StockMutation,
  UserProfile,
  CoopConfig,
  Member,
  SavingsRecord,
  LoanRecord,
  isTabAccessibleForUser,
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
import { ShoppingCart, PackagePlus, UserPlus, ArrowUp, Lock, ShieldAlert } from 'lucide-react';

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
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        const hasKasir = parsed.some((u) => u.role === 'kasir');
        if (!hasKasir) {
          const defaultKasir = initialUsers.filter((u) => u.role === 'kasir');
          const merged = [...parsed, ...defaultKasir];
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return initialUsers;
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
  const [appStage, setAppStage] = useState<'welcome' | 'select-account' | 'main'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'main';
    } catch {
      // ignore
    }
    return 'welcome';
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isQuickLookupOpen, setIsQuickLookupOpen] = useState<boolean>(false);
  const [viewingReceiptTrx, setViewingReceiptTrx] = useState<Transaction | null>(null);
  const [addProductSignal, setAddProductSignal] = useState<number>(0);
  const [addMemberSignal, setAddMemberSignal] = useState<number>(0);

  // Reset add signals when switching tabs so returning to tab shows normal default list
  useEffect(() => {
    setAddProductSignal(0);
    setAddMemberSignal(0);
  }, [activeTab]);

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

    const nowIso = new Date().toISOString();
    const newSavings: SavingsRecord[] = [];

    // 1. Simpanan Pokok
    if (newMem.simpananPokok > 0) {
      newSavings.push({
        id: `SMP-${Date.now()}-POKOK`,
        receiptNumber: `SMP-PKK-${newMem.memberNumber.slice(-4)}`,
        memberId: newMem.id,
        memberNumber: newMem.memberNumber,
        memberName: newMem.name,
        type: 'pokok',
        transactionType: 'setor',
        amount: newMem.simpananPokok,
        date: nowIso,
        notes: 'Setoran Simpanan Pokok Awal Pendaftaran Anggota',
        operator: currentUser.name || 'Petugas Koperasi',
      });
    }

    // 2. Simpanan Wajib
    if (newMem.simpananWajib > 0) {
      newSavings.push({
        id: `SMP-${Date.now() + 1}-WAJIB`,
        receiptNumber: `SMP-WJB-${newMem.memberNumber.slice(-4)}`,
        memberId: newMem.id,
        memberNumber: newMem.memberNumber,
        memberName: newMem.name,
        type: 'wajib',
        transactionType: 'setor',
        amount: newMem.simpananWajib,
        date: nowIso,
        notes: 'Setoran Simpanan Wajib Awal Pendaftaran Anggota',
        operator: currentUser.name || 'Petugas Koperasi',
      });
    }

    // 3. Simpanan Sukarela
    if (newMem.simpananSukarela > 0) {
      newSavings.push({
        id: `SMP-${Date.now() + 2}-SUKARELA`,
        receiptNumber: `SMP-SKR-${newMem.memberNumber.slice(-4)}`,
        memberId: newMem.id,
        memberNumber: newMem.memberNumber,
        memberName: newMem.name,
        type: 'sukarela',
        transactionType: 'setor',
        amount: newMem.simpananSukarela,
        date: nowIso,
        notes: 'Setoran Simpanan Sukarela Awal Pendaftaran Anggota',
        operator: currentUser.name || 'Petugas Koperasi',
      });
    }

    // 4. Simpanan Wisata / Karyawisata
    if ((newMem.simpananWisata || 0) > 0) {
      newSavings.push({
        id: `SMP-${Date.now() + 3}-WISATA`,
        receiptNumber: `SMP-WST-${newMem.memberNumber.slice(-4)}`,
        memberId: newMem.id,
        memberNumber: newMem.memberNumber,
        memberName: newMem.name,
        type: 'wisata',
        transactionType: 'setor',
        amount: newMem.simpananWisata || 0,
        date: nowIso,
        notes: 'Setoran Simpanan Karyawisata Awal Pendaftaran Anggota',
        operator: currentUser.name || 'Petugas Koperasi',
      });
    }

    if (newSavings.length > 0) {
      setSavingsRecords((prev) => [...newSavings, ...prev]);
      newSavings.forEach((s) => saveSavingsToSupabase(s));
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
        } else if (newRecord.type === 'wisata') {
          updatedMem.simpananWisata = Math.max(0, (mem.simpananWisata || 0) + delta);
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

  const mainScrollRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const handleMainScroll = () => {
    if (mainScrollRef.current) {
      setShowScrollTop(mainScrollRef.current.scrollTop > 180);
    }
  };

  const handleSwitchUser = (u: UserProfile) => {
    setCurrentUser(u);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, u.id);
    if (!isTabAccessibleForUser(activeTab, u)) {
      setActiveTab('dashboard');
    }
  };

  const handleSelectTab = (tab: string) => {
    if (!isTabAccessibleForUser(tab, currentUser)) {
      return;
    }
    setActiveTab(tab);
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
          name: 'Kepala Toko',
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
        onSelectTab={handleSelectTab}
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
          onNavigateToPos={() => handleSelectTab('pos')}
          coopConfig={coopConfig}
          currentUser={currentUser}
          isCloudConnected={isCloudConnected}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Scrollable Main Content View Container with Custom Emerald Scrollbar */}
        <main
          ref={mainScrollRef}
          onScroll={handleMainScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-5 pb-6 sm:pb-8 emerald-scrollbar scroll-smooth relative"
        >
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
              ) : activeTab === 'members' ? (
                <button
                  id="btn-header-add-member"
                  onClick={() => setAddMemberSignal((prev) => prev + 1)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition active:scale-95 self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Anggota</span>
                </button>
              ) : activeTab === 'dashboard' ? (
                <button
                  onClick={() => handleSelectTab('pos')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition active:scale-95 self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Transaksi</span>
                </button>
              ) : null}
            </div>

            {/* Proteksi Akses Jika Akun Kasir Mengakses Menu Terkunci */}
            {!isTabAccessibleForUser(activeTab, currentUser) ? (
              <div className="bg-white rounded-3xl border border-amber-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xl my-10 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4 shadow-xs">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Akses Menu Terkunci</h2>
                <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                  Akun Kasir (<strong>{currentUser.name}</strong>) hanya memiliki hak akses untuk menu: <strong>Dashboard</strong>, <strong>Kasir / Penjualan</strong>, <strong>Produk</strong>, serta <strong>Stok & Mutasi</strong>.
                </p>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 font-medium mb-6 text-left flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Menu <strong>{getPageHeaderTitle(activeTab)}</strong> terkunci dan hanya dapat dibuka melalui akun <strong>Kepala Toko</strong>.</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Ke Dashboard
                  </button>
                  <button
                    onClick={() => setAppStage('select-account')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Ganti Akun Kepala Toko
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Dashboard */}
                {activeTab === 'dashboard' && (
                  <DashboardOverview
                    transactions={transactions}
                    products={products}
                    mutations={mutations}
                    currentUser={currentUser}
                    coopConfig={coopConfig}
                    onNavigate={(tab) => handleSelectTab(tab)}
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
                onResetAddSignal={() => setAddProductSignal(0)}
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
                triggerAddSignal={addMemberSignal}
                onResetAddSignal={() => setAddMemberSignal(0)}
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

            {/* 7. Laporan (LPJ RAT Resmi & Real-Time) */}
            {activeTab === 'reports' && (
              <ReportsScreen
                transactions={transactions}
                products={products}
                members={members}
                savingsRecords={savingsRecords}
                loans={loans}
                mutations={mutations}
                users={users}
                coopConfig={coopConfig}
                onSaveCoopConfig={handleSaveConfig}
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
              </>
            )}
          </div>

          {/* Floating Sleek Emerald Scroll-to-Top Button */}
          {showScrollTop && (
            <button
              id="btn-scroll-to-top"
              onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Scroll ke atas"
              aria-label="Scroll ke atas"
              className={`fixed ${
                activeTab === 'reports' ? 'bottom-20' : 'bottom-6'
              } right-6 z-40 p-2.5 sm:p-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-950/20 border border-emerald-400/50 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer group print:hidden`}
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
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
