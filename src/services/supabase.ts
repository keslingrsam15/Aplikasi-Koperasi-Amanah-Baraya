import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Transaction, StockMutation, UserProfile, CoopConfig, Member, SavingsRecord, LoanRecord } from '../types';

// Default keys from environment if available
const ENV_SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const STORAGE_KEY_SUPABASE_CONFIG = 'koperasi_supabase_custom_credentials_v2';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Sanitizes Supabase Project URL to prevent PGRST125 errors (double slashes, trailing slashes, /rest/v1 paths)
export const cleanSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  let url = String(rawUrl).trim().replace(/[\r\n\t\s]/g, '');
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  // Remove /rest/v1 or /rest paths if inadvertently entered by user
  url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/rest\/?$/i, '');
  // Ensure http:// or https://
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
};

// Sanitizes Supabase Anon Key to prevent whitespace/newline issues
export const cleanSupabaseKey = (rawKey?: string): string => {
  if (!rawKey) return '';
  return String(rawKey).trim().replace(/[\r\n\t\s]/g, '');
};

// Get stored or env credentials
export const getSupabaseConfig = (): SupabaseConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      const url = cleanSupabaseUrl(parsed.url);
      const anonKey = cleanSupabaseKey(parsed.anonKey);
      if (url && anonKey) {
        return { url, anonKey };
      }
    }
  } catch {
    // Ignore parse errors
  }
  return {
    url: cleanSupabaseUrl(ENV_SUPABASE_URL),
    anonKey: cleanSupabaseKey(ENV_SUPABASE_ANON_KEY),
  };
};

// Save custom credentials
export const saveSupabaseConfig = (config: SupabaseConfig) => {
  const sanitized = {
    url: cleanSupabaseUrl(config.url),
    anonKey: cleanSupabaseKey(config.anonKey),
  };
  localStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(sanitized));
  cachedClient = null;
  currentClientKey = '';
};

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}_${config.anonKey}`;
  if (cachedClient && currentClientKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    currentClientKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
};

// Test connection
const missingTablesSet = new Set<string>();

export const getMissingTables = (): string[] => Array.from(missingTablesSet);

export const clearMissingTables = (): void => {
  missingTablesSet.clear();
};

export const handleSupabaseError = (contextName: string, tableName: string, err: any): void => {
  if (!err) return;
  const errCode = String(err.code || '');
  const errMessage = String(err.message || err.details || '');

  if (
    errCode === 'PGRST205' ||
    errCode === '42P01' ||
    errMessage.includes('Could not find the table') ||
    (errMessage.includes('relation') && errMessage.includes('does not exist'))
  ) {
    missingTablesSet.add(tableName);
    console.warn(
      `[Supabase Notice] Tabel 'public.${tableName}' belum dibuat di database Supabase Anda. ` +
      `Sistem menggunakan data lokal secara aman. Silakan jalankan Skrip DDL SQL di menu Pengaturan untuk mengaktifkan sinkronisasi cloud.`
    );
  } else {
    console.warn(`Supabase ${contextName} error:`, errMessage || err);
  }
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL dan Anon Key belum dikonfigurasi. Masukkan kredensial Supabase Anda terlebih dahulu.',
    };
  }

  try {
    const { error } = await client.from('products').select('id').limit(1);
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        (error.message && error.message.includes('Could not find the table'))
      ) {
        missingTablesSet.add('products');
        return {
          success: true,
          message: 'Terhubung ke Supabase! (Tabel belum dibuat, silakan salin & jalankan Skrip SQL DDL di Supabase SQL Editor).',
        };
      }
      return {
        success: false,
        message: `Koneksi Supabase Error: ${error.message} (Code: ${error.code})`,
      };
    }
    return {
      success: true,
      message: 'Koneksi ke Supabase aktif & tabel database siap digunakan!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungkan ke Supabase: ${err?.message || String(err)}`,
    };
  }
};

const ensureProductBucket = async (client: SupabaseClient) => {
  try {
    await client.storage.createBucket('product-images', { public: true });
  } catch (e) {
    // Bucket might already exist or auto-created
  }
};

// Upload Product Image (Storage Bucket: product-images or Base64 data URL)
export const uploadProductImage = async (file: File): Promise<string> => {
  const client = getSupabaseClient();
  
  if (client) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `products/${cleanFileName}`;

      let { error: uploadError } = await client.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // Try creating bucket and retrying
        await ensureProductBucket(client);
        const retryResult = await client.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });
        uploadError = retryResult.error;
      }

      if (!uploadError) {
        const { data } = client.storage.from('product-images').getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Storage bucket upload fallback:', err);
    }
  }

  // Fallback to Base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Gagal membaca file'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar'));
    reader.readAsDataURL(file);
  });
};

// Upload Cooperative Logo (Storage Bucket: product-images/logos or Base64 data URL)
export const uploadCoopLogo = async (file: File): Promise<string> => {
  const client = getSupabaseClient();

  if (client) {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanFileName = `logo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `logos/${cleanFileName}`;

      let { error: uploadError } = await client.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        await ensureProductBucket(client);
        const retryResult = await client.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });
        uploadError = retryResult.error;
      }

      if (!uploadError) {
        const { data } = client.storage.from('product-images').getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Logo storage bucket upload fallback:', err);
    }
  }

  // Fallback to Base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Gagal membaca file logo'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas logo'));
    reader.readAsDataURL(file);
  });
};

// Upload Banner Image (Storage Bucket: product-images/banners or Base64 data URL)
export const uploadBannerImage = async (file: File): Promise<string> => {
  const client = getSupabaseClient();

  if (client) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `banners/${cleanFileName}`;

      let { error: uploadError } = await client.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        await ensureProductBucket(client);
        const retryResult = await client.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });
        uploadError = retryResult.error;
      }

      if (!uploadError) {
        const { data } = client.storage.from('product-images').getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Banner storage bucket upload fallback:', err);
    }
  }

  // Fallback to Base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Gagal membaca file banner'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas banner'));
    reader.readAsDataURL(file);
  });
};

/* ==========================================================================
   PRODUCTS CRUD
   ========================================================================== */

export const fetchProductsFromSupabase = async (): Promise<Product[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      handleSupabaseError('fetchProducts', 'products', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      code: row.code,
      barcode: row.barcode || row.code,
      name: row.name,
      category: row.category,
      buyPrice: Number(row.buy_price) || 0,
      sellPrice: Number(row.sell_price) || 0,
      stock: Number(row.stock) || 0,
      minStock: Number(row.min_stock) || 0,
      unit: row.unit || 'Pcs',
      imageUrl: row.image_url || undefined,
      supplier: row.supplier || undefined,
      description: row.description || undefined,
      updatedAt: row.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    handleSupabaseError('fetchProducts', 'products', err);
    return null;
  }
};

export const saveProductToSupabase = async (product: Product): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: product.id,
      code: product.code,
      barcode: product.barcode || product.code,
      name: product.name,
      category: product.category,
      buy_price: product.buyPrice,
      sell_price: product.sellPrice,
      stock: product.stock,
      min_stock: product.minStock,
      unit: product.unit,
      image_url: product.imageUrl || null,
      supplier: product.supplier || null,
      description: product.description || null,
      updated_at: product.updatedAt || new Date().toISOString(),
    };

    const { error } = await client.from('products').upsert(payload);
    if (error) {
      handleSupabaseError('saveProduct', 'products', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('saveProduct', 'products', err);
    return false;
  }
};

export const deleteProductFromSupabase = async (productId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('products').delete().eq('id', productId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteProduct error:', err);
    return false;
  }
};

/* ==========================================================================
   TRANSACTIONS CRUD
   ========================================================================== */

export const fetchTransactionsFromSupabase = async (): Promise<Transaction[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let result = await client
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    // Fallback if ordering by 'date' fails or table has different schema
    if (result.error) {
      if (result.error.code === '42703' || result.error.code === 'PGRST125') {
        result = await client.from('transactions').select('*');
      }
    }

    if (result.error) {
      if (result.error.code === '42P01' || result.error.code === 'PGRST125' || result.error.code === 'PGRST204') {
        console.warn('Supabase transactions table not ready or schema pending:', result.error.message);
        return null;
      }
      throw result.error;
    }

    const data = result.data;
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      invoiceNumber: row.invoice_number || row.id,
      date: row.date || row.timestamp || row.created_at || new Date().toISOString(),
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [],
      totalItems: Number(row.total_items) || (Array.isArray(row.items) ? row.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 0),
      subtotal: Number(row.subtotal) || 0,
      discountTotal: Number(row.discount_total || row.discount_amount) || 0,
      grandTotal: Number(row.grand_total || row.total_amount) || 0,
      paymentAmount: Number(row.payment_amount || row.cash_paid) || 0,
      changeAmount: Number(row.change_amount || row.cash_change) || 0,
      paymentMethod: row.payment_method || 'cash',
      customerType: row.customer_type || 'umum',
      customerName: row.customer_name || row.customer_id_or_name || undefined,
      memberNumber: row.member_number || undefined,
      cashierName: row.cashier_name || 'Kasir',
      cashierId: row.cashier_id || 'USR-01',
      notes: row.notes || undefined,
      totalCost: Number(row.total_cost) || 0,
      totalProfit: Number(row.total_profit) || 0,
    }));
  } catch (err: any) {
    console.warn('Supabase fetchTransactions error:', err?.message || err);
    return null;
  }
};

export const saveTransactionToSupabase = async (tx: Transaction): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: tx.id,
      invoice_number: tx.invoiceNumber,
      date: tx.date,
      items: tx.items,
      total_items: tx.totalItems,
      subtotal: tx.subtotal,
      discount_total: tx.discountTotal,
      grand_total: tx.grandTotal,
      payment_amount: tx.paymentAmount,
      change_amount: tx.changeAmount,
      payment_method: tx.paymentMethod,
      customer_type: tx.customerType,
      customer_name: tx.customerName || null,
      member_number: tx.memberNumber || null,
      cashier_name: tx.cashierName,
      cashier_id: tx.cashierId,
      notes: tx.notes || null,
      total_cost: tx.totalCost,
      total_profit: tx.totalProfit,
    };

    const { error } = await client.from('transactions').upsert(payload);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase saveTransaction error:', err);
    return false;
  }
};

/* ==========================================================================
   STOCK MUTATIONS CRUD
   ========================================================================== */

export const fetchMutationsFromSupabase = async (): Promise<StockMutation[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('stock_mutations')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      handleSupabaseError('fetchMutations', 'stock_mutations', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      productCode: row.product_code,
      productName: row.product_name,
      type: row.type,
      quantity: Number(row.quantity) || 0,
      previousStock: Number(row.previous_stock ?? row.stock_before) || 0,
      newStock: Number(row.new_stock ?? row.stock_after) || 0,
      reason: row.reason || row.notes || 'Penyesuaian Stok',
      date: row.date || row.timestamp || new Date().toISOString(),
      operator: row.operator || row.operator_name || 'Petugas',
      referenceNumber: row.reference_number || undefined,
      costPrice: row.cost_price ? Number(row.cost_price) : undefined,
    }));
  } catch (err) {
    handleSupabaseError('fetchMutations', 'stock_mutations', err);
    return null;
  }
};

export const saveMutationToSupabase = async (mutation: StockMutation): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: mutation.id,
      product_id: mutation.productId,
      product_code: mutation.productCode,
      product_name: mutation.productName,
      type: mutation.type,
      quantity: mutation.quantity,
      previous_stock: mutation.previousStock,
      new_stock: mutation.newStock,
      reason: mutation.reason,
      date: mutation.date,
      operator: mutation.operator,
      reference_number: mutation.referenceNumber || null,
      cost_price: mutation.costPrice || null,
    };

    const { error } = await client.from('stock_mutations').upsert(payload);
    if (error) {
      handleSupabaseError('saveMutation', 'stock_mutations', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('saveMutation', 'stock_mutations', err);
    return false;
  }
};

/* ==========================================================================
   COOP CONFIG & USERS CRUD
   ========================================================================== */

export const fetchConfigFromSupabase = async (): Promise<CoopConfig | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('coop_config')
      .select('*')
      .eq('id', 'default_config')
      .maybeSingle();

    if (error) {
      handleSupabaseError('fetchConfig', 'coop_config', error);
      return null;
    }
    if (!data) return null;

    return typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
  } catch (err) {
    handleSupabaseError('fetchConfig', 'coop_config', err);
    return null;
  }
};

export const saveConfigToSupabase = async (config: CoopConfig): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: 'default_config',
      data: config,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('coop_config').upsert(payload);
    if (error) {
      handleSupabaseError('saveConfig', 'coop_config', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('saveConfig', 'coop_config', err);
    return false;
  }
};

export const fetchUsersFromSupabase = async (): Promise<UserProfile[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      handleSupabaseError('fetchUsers', 'user_profiles', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      avatarColor: row.avatar_color,
      nipOrNik: row.nip_or_nik || undefined,
      phone: row.phone || undefined,
      shift: row.shift || undefined,
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions || undefined,
    }));
  } catch (err) {
    handleSupabaseError('fetchUsers', 'user_profiles', err);
    return null;
  }
};

export const saveUserToSupabase = async (user: UserProfile): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar_color: user.avatarColor,
      nip_or_nik: user.nipOrNik || null,
      phone: user.phone || null,
      shift: user.shift || null,
      permissions: user.permissions || null,
    };

    const { error } = await client.from('user_profiles').upsert(payload);
    if (error) {
      handleSupabaseError('saveUser', 'user_profiles', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('saveUser', 'user_profiles', err);
    return false;
  }
};

export const deleteUserFromSupabase = async (userId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('user_profiles').delete().eq('id', userId);
    if (error) {
      handleSupabaseError('deleteUser', 'user_profiles', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('deleteUser', 'user_profiles', err);
    return false;
  }
};

/* ==========================================================================
   MEMBER (ANGGOTA KOPERASI) CRUD
   ========================================================================== */

export const fetchMembersFromSupabase = async (): Promise<Member[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('coop_members')
      .select('*')
      .order('member_number', { ascending: true });

    if (error) {
      handleSupabaseError('fetchMembers', 'coop_members', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      memberNumber: row.member_number,
      name: row.name,
      nikOrNip: row.nik_or_nip || undefined,
      unitKerja: row.unit_kerja || 'Umum',
      phone: row.phone || undefined,
      email: row.email || undefined,
      joinDate: row.join_date || new Date().toISOString().slice(0, 10),
      status: row.status || 'active',
      simpananPokok: Number(row.simpanan_pokok || 0),
      simpananWajib: Number(row.simpanan_wajib || 0),
      simpananSukarela: Number(row.simpanan_sukarela || 0),
      address: row.address || undefined,
      notes: row.notes || undefined,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    handleSupabaseError('fetchMembers', 'coop_members', err);
    return null;
  }
};

export const saveMemberToSupabase = async (member: Member): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: member.id,
      member_number: member.memberNumber,
      name: member.name,
      nik_or_nip: member.nikOrNip || null,
      unit_kerja: member.unitKerja,
      phone: member.phone || null,
      email: member.email || null,
      join_date: member.joinDate,
      status: member.status,
      simpanan_pokok: member.simpananPokok,
      simpanan_wajib: member.simpananWajib,
      simpanan_sukarela: member.simpananSukarela,
      address: member.address || null,
      notes: member.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('coop_members').upsert(payload);
    if (error) {
      handleSupabaseError('saveMember', 'coop_members', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('saveMember', 'coop_members', err);
    return false;
  }
};

export const deleteMemberFromSupabase = async (memberId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('coop_members').delete().eq('id', memberId);
    if (error) {
      handleSupabaseError('deleteMember', 'coop_members', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('deleteMember', 'coop_members', err);
    return false;
  }
};

/* ==========================================================================
   SAVINGS (SIMPANAN) CRUD
   ========================================================================== */

export const fetchSavingsFromSupabase = async (): Promise<SavingsRecord[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('coop_savings')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      handleSupabaseError('fetchSavings', 'coop_savings', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      memberId: row.member_id,
      memberNumber: row.member_number,
      memberName: row.member_name,
      type: row.type,
      transactionType: row.transaction_type,
      amount: Number(row.amount || 0),
      date: row.date,
      notes: row.notes || undefined,
      operator: row.operator || 'Admin',
      receiptNumber: row.receipt_number || undefined,
    }));
  } catch (err) {
    handleSupabaseError('fetchSavings', 'coop_savings', err);
    return null;
  }
};

export const saveSavingsToSupabase = async (record: SavingsRecord): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: record.id,
      member_id: record.memberId,
      member_number: record.memberNumber,
      member_name: record.memberName,
      type: record.type,
      transaction_type: record.transactionType,
      amount: record.amount,
      date: record.date,
      notes: record.notes || null,
      operator: record.operator,
      receipt_number: record.receiptNumber || null,
    };

    const { error } = await client.from('coop_savings').upsert(payload);
    if (error) {
      handleSupabaseError('saveSavings', 'coop_savings', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('saveSavings', 'coop_savings', err);
    return false;
  }
};

export const deleteSavingsFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('coop_savings').delete().eq('id', id);
    if (error) {
      handleSupabaseError('deleteSavings', 'coop_savings', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('deleteSavings', 'coop_savings', err);
    return false;
  }
};

/* ==========================================================================
   LOANS (PINJAMAN) CRUD
   ========================================================================== */

export const fetchLoansFromSupabase = async (): Promise<LoanRecord[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('coop_loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError('fetchLoans', 'coop_loans', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      loanNumber: row.loan_number,
      memberId: row.member_id,
      memberNumber: row.member_number,
      memberName: row.member_name,
      unitKerja: row.unit_kerja,
      amount: Number(row.amount || 0),
      interestRate: Number(row.interest_rate || 0),
      tenorMonths: Number(row.tenor_months || 0),
      monthlyInstallment: Number(row.monthly_installment || 0),
      totalRepayment: Number(row.total_repayment || 0),
      totalPaid: Number(row.total_paid || 0),
      remainingAmount: Number(row.remaining_amount || 0),
      startDate: row.start_date,
      endDate: row.end_date,
      purpose: row.purpose || 'Pinjaman Koperasi',
      status: row.status || 'pending',
      installments: typeof row.installments === 'string' ? JSON.parse(row.installments) : row.installments || [],
      approvedBy: row.approved_by || undefined,
      approvedDate: row.approved_date || undefined,
      createdAt: row.created_at,
    }));
  } catch (err) {
    handleSupabaseError('fetchLoans', 'coop_loans', err);
    return null;
  }
};

export const saveLoanToSupabase = async (loan: LoanRecord): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: loan.id,
      loan_number: loan.loanNumber,
      member_id: loan.memberId,
      member_number: loan.memberNumber,
      member_name: loan.memberName,
      unit_kerja: loan.unitKerja,
      amount: loan.amount,
      interest_rate: loan.interestRate,
      tenor_months: loan.tenorMonths,
      monthly_installment: loan.monthlyInstallment,
      total_repayment: loan.totalRepayment,
      total_paid: loan.totalPaid,
      remaining_amount: loan.remainingAmount,
      start_date: loan.startDate,
      end_date: loan.endDate,
      purpose: loan.purpose,
      status: loan.status,
      installments: loan.installments || [],
      approved_by: loan.approvedBy || null,
      approved_date: loan.approvedDate || null,
      created_at: loan.createdAt,
    };

    const { error } = await client.from('coop_loans').upsert(payload);
    if (error) {
      handleSupabaseError('saveLoan', 'coop_loans', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('saveLoan', 'coop_loans', err);
    return false;
  }
};

export const deleteLoanFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('coop_loans').delete().eq('id', id);
    if (error) {
      handleSupabaseError('deleteLoan', 'coop_loans', error);
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError('deleteLoan', 'coop_loans', err);
    return false;
  }
};

/* ==========================================================================
   BULK SYNC ALL TO SUPABASE
   ========================================================================== */

export const syncAllToSupabase = async (payload: {
  products: Product[];
  transactions: Transaction[];
  mutations: StockMutation[];
  users: UserProfile[];
  config: CoopConfig;
  members?: Member[];
  savings?: SavingsRecord[];
  loans?: LoanRecord[];
}): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL dan Anon Key belum dikonfigurasi.',
    };
  }

  try {
    // 1. Sync Config
    await saveConfigToSupabase(payload.config);

    // 2. Sync Users
    for (const u of payload.users) {
      await saveUserToSupabase(u);
    }

    // 3. Sync Products
    for (const p of payload.products) {
      await saveProductToSupabase(p);
    }

    // 4. Sync Transactions
    for (const t of payload.transactions) {
      await saveTransactionToSupabase(t);
    }

    // 5. Sync Mutations
    for (const m of payload.mutations) {
      await saveMutationToSupabase(m);
    }

    // 6. Sync Members
    if (payload.members) {
      for (const mem of payload.members) {
        await saveMemberToSupabase(mem);
      }
    }

    // 7. Sync Savings
    if (payload.savings) {
      for (const s of payload.savings) {
        await saveSavingsToSupabase(s);
      }
    }

    // 8. Sync Loans
    if (payload.loans) {
      for (const l of payload.loans) {
        await saveLoanToSupabase(l);
      }
    }

    return {
      success: true,
      message: `Berhasil menyinkronkan data koperasi, ${payload.products.length} barang, ${payload.transactions.length} transaksi, ${payload.members?.length || 0} anggota ke Supabase Cloud!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal sinkronisasi data ke Supabase: ${err?.message || String(err)}`,
    };
  }
};

/* ==========================================================================
   SQL DDL SCHEMA TEMPLATE
   ========================================================================== */

export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- SKEMA DATABASE SUPABASE UNTUK KASIR KOPERASI AMANAH BARAYA
-- RSUD AL-MULK KOTA SUKABUMI
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda
-- ==========================================================

-- 1. TABEL PRODUK / MASTER BARANG
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  buy_price NUMERIC(15,2) DEFAULT 0,
  sell_price NUMERIC(15,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'Pcs',
  image_url TEXT,
  supplier TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL TRANSAKSI PENJUALAN KASIR
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_items INTEGER DEFAULT 0,
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  grand_total NUMERIC(15,2) DEFAULT 0,
  payment_amount NUMERIC(15,2) DEFAULT 0,
  change_amount NUMERIC(15,2) DEFAULT 0,
  payment_method TEXT NOT NULL,
  customer_type TEXT NOT NULL,
  customer_name TEXT,
  member_number TEXT,
  cashier_name TEXT NOT NULL,
  cashier_id TEXT NOT NULL,
  notes TEXT,
  total_cost NUMERIC(15,2) DEFAULT 0,
  total_profit NUMERIC(15,2) DEFAULT 0
);

-- 3. TABEL MUTASI & HISTORI STOK
CREATE TABLE IF NOT EXISTS public.stock_mutations (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  operator TEXT NOT NULL,
  reference_number TEXT,
  cost_price NUMERIC(15,2)
);

-- 4. TABEL PENGATURAN KOPERASI & PRINTER
CREATE TABLE IF NOT EXISTS public.coop_config (
  id TEXT PRIMARY KEY DEFAULT 'default_config',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL PENGGUNA & KASIR
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  nip_or_nik TEXT,
  phone TEXT,
  shift TEXT,
  permissions JSONB DEFAULT '[]'::jsonb
);

-- 6. TABEL DATA ANGGOTA KOPERASI
CREATE TABLE IF NOT EXISTS public.coop_members (
  id TEXT PRIMARY KEY,
  member_number TEXT NOT NULL,
  name TEXT NOT NULL,
  nik_or_nip TEXT,
  unit_kerja TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  simpanan_pokok NUMERIC(15,2) DEFAULT 0,
  simpanan_wajib NUMERIC(15,2) DEFAULT 0,
  simpanan_sukarela NUMERIC(15,2) DEFAULT 0,
  address TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL TRANSAKSI SIMPANAN (MUTASI SIMPANAN)
CREATE TABLE IF NOT EXISTS public.coop_savings (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  member_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pokok', 'wajib', 'sukarela'
  transaction_type TEXT NOT NULL, -- 'setor', 'tarik'
  amount NUMERIC(15,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  operator TEXT NOT NULL,
  receipt_number TEXT
);

-- 8. TABEL PINJAMAN ANGGOTA
CREATE TABLE IF NOT EXISTS public.coop_loans (
  id TEXT PRIMARY KEY,
  loan_number TEXT NOT NULL,
  member_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  member_name TEXT NOT NULL,
  unit_kerja TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  interest_rate NUMERIC(5,2) DEFAULT 1.0,
  tenor_months INTEGER NOT NULL,
  monthly_installment NUMERIC(15,2) NOT NULL,
  total_repayment NUMERIC(15,2) NOT NULL,
  total_paid NUMERIC(15,2) DEFAULT 0,
  remaining_amount NUMERIC(15,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  installments JSONB DEFAULT '[]'::jsonb,
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS) DENGAN AKSES ANOMIM/PUBLIK UNTUK APLIKASI KASIR
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_loans ENABLE ROW LEVEL SECURITY;

-- BUAT POLISI IZIN FULL AKSES UNTUK KLIEN
DROP POLICY IF EXISTS "Public access products" ON public.products;
CREATE POLICY "Public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access transactions" ON public.transactions;
CREATE POLICY "Public access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access stock_mutations" ON public.stock_mutations;
CREATE POLICY "Public access stock_mutations" ON public.stock_mutations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access coop_config" ON public.coop_config;
CREATE POLICY "Public access coop_config" ON public.coop_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access user_profiles" ON public.user_profiles;
CREATE POLICY "Public access user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access coop_members" ON public.coop_members;
CREATE POLICY "Public access coop_members" ON public.coop_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access coop_savings" ON public.coop_savings;
CREATE POLICY "Public access coop_savings" ON public.coop_savings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access coop_loans" ON public.coop_loans;
CREATE POLICY "Public access coop_loans" ON public.coop_loans FOR ALL USING (true) WITH CHECK (true);

-- BUAT STORAGE BUCKET UNTUK FOTO PRODUK (JIKA DIPERLUKAN)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public upload product images" ON storage.objects;
CREATE POLICY "Public upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public update product images" ON storage.objects;
CREATE POLICY "Public update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
`;
