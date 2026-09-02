import { Transaction, CoopConfig } from '../types';
import { formatRupiah, formatDateTimeIndo } from './formatters';

// Common Bluetooth POS Printer GATT Service & Characteristic UUIDs
const BLUETOOTH_PRINT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Serial / Print
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common POS-58/80
  'e7810a01-73ae-499d-8c15-faa9aef0c3f2', // Rongta / RPP
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2540
];

const BLUETOOTH_PRINT_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ff01-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
];

export interface BluetoothDeviceState {
  device: any | null;
  server: any | null;
  characteristic: any | null;
  name: string;
  connected: boolean;
}

// Global cached bluetooth device state
let activeBluetoothDevice: BluetoothDeviceState = {
  device: null,
  server: null,
  characteristic: null,
  name: '',
  connected: false,
};

export const isBluetoothSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

export const getActiveBluetoothPrinter = (): BluetoothDeviceState => {
  return activeBluetoothDevice;
};

/**
 * Request user to pair & connect Bluetooth Thermal Printer via Web Bluetooth API
 */
export const connectBluetoothPrinter = async (): Promise<{ success: boolean; name?: string; error?: string }> => {
  if (!isBluetoothSupported()) {
    return {
      success: false,
      error: 'Browser ini belum mendukung Web Bluetooth API. Gunakan Google Chrome / Edge di Desktop atau Android.',
    };
  }

  try {
    const navBt = (navigator as any).bluetooth;
    // Request device with common printer filters or acceptAllDevices
    const device = await navBt.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLUETOOTH_PRINT_SERVICES,
    });

    if (!device) {
      return { success: false, error: 'Tidak ada printer yang dipilih.' };
    }

    const server = await device.gatt.connect();

    // Search for writable characteristic among available services
    let targetCharacteristic = null;

    const services = await server.getPrimaryServices().catch(() => []);
    for (const service of services) {
      const characteristics = await service.getCharacteristics().catch(() => []);
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          targetCharacteristic = char;
          break;
        }
      }
      if (targetCharacteristic) break;
    }

    if (!targetCharacteristic) {
      // Try known standard service
      for (const serviceUuid of BLUETOOTH_PRINT_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          for (const charUuid of BLUETOOTH_PRINT_CHARACTERISTICS) {
            try {
              const char = await service.getCharacteristic(charUuid);
              if (char.properties.write || char.properties.writeWithoutResponse) {
                targetCharacteristic = char;
                break;
              }
            } catch {
              // continue
            }
          }
          if (targetCharacteristic) break;
        } catch {
          // continue
        }
      }
    }

    if (!targetCharacteristic) {
      return {
        success: false,
        error: 'Berhasil terhubung, namun karakteristik print writer printer tidak ditemukan.',
      };
    }

    activeBluetoothDevice = {
      device,
      server,
      characteristic: targetCharacteristic,
      name: device.name || 'Thermal POS Printer',
      connected: true,
    };

    device.addEventListener('gattserverdisconnected', () => {
      activeBluetoothDevice.connected = false;
    });

    return {
      success: true,
      name: activeBluetoothDevice.name,
    };
  } catch (err: any) {
    console.error('Bluetooth connection error:', err);
    return {
      success: false,
      error: err?.message || 'Gagal menyambungkan printer Bluetooth.',
    };
  }
};

export const disconnectBluetoothPrinter = () => {
  if (activeBluetoothDevice.server && activeBluetoothDevice.connected) {
    try {
      activeBluetoothDevice.device?.gatt?.disconnect();
    } catch {
      // ignore
    }
  }
  activeBluetoothDevice = {
    device: null,
    server: null,
    characteristic: null,
    name: '',
    connected: false,
  };
};

/**
 * Format string with exact column width and alignment for thermal paper
 */
const formatTwoColumns = (left: string, right: string, maxCols: number): string => {
  const leftLen = left.length;
  const rightLen = right.length;
  const spacesNeeded = maxCols - (leftLen + rightLen);
  if (spacesNeeded > 0) {
    return left + ' '.repeat(spacesNeeded) + right;
  }
  // If too long, truncate left text
  const truncatedLeft = left.substring(0, Math.max(5, maxCols - rightLen - 1));
  const remainingSpaces = Math.max(1, maxCols - (truncatedLeft.length + rightLen));
  return truncatedLeft + ' '.repeat(remainingSpaces) + right;
};

/**
 * Generate standard ESC/POS Byte Array from Transaction data
 */
export const generateEscPosReceipt = (
  transaction: Transaction,
  coopConfig: CoopConfig,
  paperWidth: '58mm' | '80mm' = '58mm'
): Uint8Array => {
  const maxCols = paperWidth === '80mm' ? 48 : 32;
  const divider = '-'.repeat(maxCols);
  const doubleDivider = '='.repeat(maxCols);

  const encoder = new TextEncoder();
  const chunks: number[] = [];

  const addBytes = (...bytes: number[]) => chunks.push(...bytes);
  const addText = (text: string) => {
    const encoded = encoder.encode(text);
    for (let i = 0; i < encoded.length; i++) {
      chunks.push(encoded[i]);
    }
  };
  const addLine = (text: string = '') => {
    addText(text + '\n');
  };

  // ESC @: Initialize Printer
  addBytes(0x1b, 0x40);

  // ESC t 0: Select character code table (PC437 USA / Standard)
  addBytes(0x1b, 0x74, 0x00);

  // Header / Kop Koperasi (Center Aligned)
  addBytes(0x1b, 0x61, 0x01); // Center
  addBytes(0x1b, 0x45, 0x01); // Bold ON
  addBytes(0x1d, 0x21, 0x01); // Double height
  addLine(coopConfig.name);
  addBytes(0x1d, 0x21, 0x00); // Normal size
  addLine(coopConfig.hospitalName);
  addBytes(0x1b, 0x45, 0x00); // Bold OFF
  addLine(coopConfig.address);
  addLine(`Telp: ${coopConfig.phone}`);
  addLine(divider);

  // Metadata Transaksi (Left Aligned)
  addBytes(0x1b, 0x61, 0x00); // Left
  addLine(formatTwoColumns(`No: ${transaction.invoiceNumber}`, '', maxCols));
  addLine(formatTwoColumns(`Tgl: ${formatDateTimeIndo(transaction.date)}`, '', maxCols));
  addLine(formatTwoColumns(`Kasir: ${transaction.cashierName}`, '', maxCols));
  const custName = transaction.customerName || (
    transaction.customerType === 'anggota' ? 'Anggota Koperasi' :
    transaction.customerType === 'karyawan_rsud' ? 'Karyawan RSUD' :
    transaction.customerType === 'pasien' ? 'Pasien / Keluarga' : 'Pelanggan Umum'
  );
  addLine(formatTwoColumns(`Pelanggan: ${custName}`, '', maxCols));
  addLine(divider);

  // Item List
  transaction.items.forEach((item) => {
    // Product Name (can wrap to next line)
    addLine(item.product.name);
    // Quantity x Price = Subtotal
    const leftDetail = `  ${item.quantity} ${item.product.unit} x ${formatRupiah(item.product.sellPrice)}`;
    const rightSubtotal = formatRupiah(item.subtotal);
    addLine(formatTwoColumns(leftDetail, rightSubtotal, maxCols));
    if (item.discountNominal > 0) {
      addLine(formatTwoColumns(`    (Diskon)`, `-${formatRupiah(item.discountNominal)}`, maxCols));
    }
  });

  addLine(divider);

  // Totals Section
  addLine(formatTwoColumns(`Total Item (${transaction.totalItems} pcs)`, formatRupiah(transaction.subtotal), maxCols));
  if (transaction.discountTotal > 0) {
    addLine(formatTwoColumns('Potongan Diskon', `-${formatRupiah(transaction.discountTotal)}`, maxCols));
  }

  // Grand Total (Bold + Double Height)
  addBytes(0x1b, 0x45, 0x01); // Bold ON
  addBytes(0x1d, 0x21, 0x01); // Double height
  addLine(formatTwoColumns('TOTAL', formatRupiah(transaction.grandTotal), maxCols));
  addBytes(0x1d, 0x21, 0x00); // Normal height
  addBytes(0x1b, 0x45, 0x00); // Bold OFF

  addLine(doubleDivider);

  // Payment Details
  addLine(formatTwoColumns('Metode Bayar', transaction.paymentMethod.toUpperCase(), maxCols));
  addLine(formatTwoColumns('Bayar / Tunai', formatRupiah(transaction.paymentAmount), maxCols));
  addBytes(0x1b, 0x45, 0x01); // Bold ON
  addLine(formatTwoColumns('KEMBALIAN', formatRupiah(transaction.changeAmount), maxCols));
  addBytes(0x1b, 0x45, 0x00); // Bold OFF

  addLine(divider);

  // Footer Message (Center Aligned)
  addBytes(0x1b, 0x61, 0x01); // Center
  addLine(coopConfig.receiptFooter);
  addLine('Koperasi Amanah Baraya');
  addLine('RSUD Al-Mulk Sukabumi');

  // Feed 4 lines & Partial/Full Paper Cut (GS V 66 0)
  addBytes(0x1b, 0x64, 0x04); // Feed 4 lines
  addBytes(0x1d, 0x56, 0x41, 0x00); // GS V 65 0: Cut paper

  return new Uint8Array(chunks);
};

/**
 * Generate ESC/POS for Test Print
 */
export const generateEscPosTest = (coopConfig: CoopConfig, paperWidth: '58mm' | '80mm' = '58mm'): Uint8Array => {
  const maxCols = paperWidth === '80mm' ? 48 : 32;
  const divider = '='.repeat(maxCols);
  const encoder = new TextEncoder();
  const chunks: number[] = [];

  const addBytes = (...bytes: number[]) => chunks.push(...bytes);
  const addLine = (text: string = '') => {
    const encoded = encoder.encode(text + '\n');
    for (let i = 0; i < encoded.length; i++) chunks.push(encoded[i]);
  };

  addBytes(0x1b, 0x40); // Init
  addBytes(0x1b, 0x61, 0x01); // Center
  addBytes(0x1b, 0x45, 0x01); // Bold
  addLine('*** UJI COBA PRINTER POS ***');
  addLine(coopConfig.name);
  addLine(coopConfig.hospitalName);
  addBytes(0x1b, 0x45, 0x00); // Bold off
  addLine(divider);
  addLine(`Lebar Kertas: ${paperWidth} (${maxCols} Kolom)`);
  addLine(`Status: TERHUBUNG NORMAL`);
  addLine(`Waktu: ${new Date().toLocaleString('id-ID')}`);
  addLine(divider);
  addLine('Koneksi Printer Thermal Berhasil!');
  addLine('Siap Mencetak Struk Kasir.');
  addBytes(0x1b, 0x64, 0x04); // Feed
  addBytes(0x1d, 0x56, 0x41, 0x00); // Cut

  return new Uint8Array(chunks);
};

/**
 * Print directly to Bluetooth Printer in small chunks
 */
export const printViaBluetooth = async (
  data: Uint8Array,
  copies: number = 1
): Promise<{ success: boolean; error?: string }> => {
  if (!activeBluetoothDevice.connected || !activeBluetoothDevice.characteristic) {
    return {
      success: false,
      error: 'Printer Bluetooth belum terhubung. Silakan klik Sambungkan Printer terlebih dahulu.',
    };
  }

  try {
    const characteristic = activeBluetoothDevice.characteristic;
    const chunkSize = 100; // 100 bytes chunk size for Bluetooth GATT MTU stability

    for (let c = 0; c < copies; c++) {
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        if (characteristic.writeValueWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk);
        } else {
          await characteristic.writeValue(chunk);
        }
        // Small delay to prevent buffer overflow on mini printer MCUs
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      if (copies > 1 && c < copies - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Print bluetooth error:', err);
    return {
      success: false,
      error: err?.message || 'Gagal mengirim data cetak ke printer Bluetooth.',
    };
  }
};

/**
 * Generate Android RawBT Intent URL for 1-click native printing on Android mobile/tablets
 */
export const getRawBtPrintUrl = (data: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  const base64 = btoa(binary);
  return `rawbt:data:base64,${base64}`;
};

/**
 * Trigger clean native thermal print dialog with zero margins
 */
export const printViaBrowserNative = (elementId: string = 'printable-thermal-receipt') => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Use hidden iframe method for clean thermal print without affecting host DOM
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const receiptHtml = element.outerHTML;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Struk Pembayaran</title>
        <style>
          @page {
            margin: 0mm;
            size: auto;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 4px 6px;
            font-family: 'Courier New', Courier, monospace;
            background: #fff;
            color: #000;
            font-size: 11px;
            line-height: 1.35;
          }
          #printable-thermal-receipt {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }
          .border-b, .border-t, .border-dashed {
            border-color: #000 !important;
          }
          svg, img {
            max-width: 100%;
            height: auto;
          }
          .print-hidden, button {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${receiptHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 1000);
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
};
