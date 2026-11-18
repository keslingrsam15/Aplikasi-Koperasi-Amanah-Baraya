import type { CoopConfig } from '../types';

export const DEFAULT_QRIS_IMAGE_URL = '/assets/aistudio/image_8e0e5b91.png';

// Exact static EMVCo QRIS payload decoded from Koperasi Amanah Baraya's official Bank BSI QRIS poster
export const DEFAULT_QRIS_STATIC_PAYLOAD =
  '00020101021126640017ID.CO.BANKBSI.WWW0118936004510000724054021000009499350303UMI51440014ID.CO.QRIS.WWW0215ID10265827852790303UMI5204541153033605802ID5922KOPERASI AMANAH BARAYA6008SUKABUMI610543169630472EF';

export const DEFAULT_QRIS_MERCHANT_NAME = 'KOPERASI AMANAH BARAYA';
export const DEFAULT_QRIS_NMID = 'ID1026582785279';

export interface EmvTlvTag {
  tag: string;
  value: string;
}

export interface QrisMetadata {
  isValid: boolean;
  crcValid: boolean;
  isDynamic: boolean;
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  nmid?: string;
  acquirerDomain?: string;
  amount?: number;
}

export interface ResolvedQrisConfig {
  imageUrl: string;
  staticPayload: string;
  merchantName: string;
  nmid: string;
  defaultMode: 'dynamic' | 'static';
  hasValidPayload: boolean;
  metadata: QrisMetadata;
}

/**
 * Computes CRC-16/CCITT-FALSE checksum (polynomial 0x1021, initial value 0xFFFF)
 * as specified by the EMVCo QR Code / Bank Indonesia QRIS specification.
 */
export function computeCrc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Parses EMVCo TLV (Tag-Length-Value) records sequentially.
 * Returns null if the payload is malformed.
 */
export function parseEmvTlv(payload: string): EmvTlvTag[] | null {
  const cleaned = payload.trim();
  if (cleaned.length < 12) return null;

  const tags: EmvTlvTag[] = [];
  let cursor = 0;

  while (cursor < cleaned.length) {
    if (cursor + 4 > cleaned.length) return null;
    const tag = cleaned.slice(cursor, cursor + 2);
    const lenStr = cleaned.slice(cursor + 2, cursor + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) {
      return null;
    }
    const len = parseInt(lenStr, 10);
    const valueStart = cursor + 4;
    const valueEnd = valueStart + len;
    if (valueEnd > cleaned.length) {
      return null;
    }
    tags.push({ tag, value: cleaned.slice(valueStart, valueEnd) });
    cursor = valueEnd;
  }

  return tags;
}

/**
 * Serializes EMVCo TLV tags back to a raw payload string.
 */
export function serializeEmvTlv(tags: EmvTlvTag[]): string {
  return tags
    .map(({ tag, value }) => {
      const lengthStr = String(value.length).padStart(2, '0');
      return `${tag}${lengthStr}${value}`;
    })
    .join('');
}

/**
 * Verifies the trailing Tag 63 CRC-16/CCITT-FALSE checksum of an EMVCo QRIS string.
 */
export function verifyQrisCrc(qris: string): boolean {
  const cleaned = qris.trim();
  if (cleaned.length < 12) return false;
  const crcIndex = cleaned.lastIndexOf('6304');
  if (crcIndex === -1 || crcIndex + 8 !== cleaned.length) {
    return false;
  }
  const bodyWithCrcHeader = cleaned.slice(0, crcIndex + 4);
  const expectedCrc = cleaned.slice(crcIndex + 4).toUpperCase();
  return computeCrc16Ccitt(bodyWithCrcHeader) === expectedCrc;
}

/**
 * Extracts readable merchant metadata and validates structure from a QRIS payload string.
 */
export function parseQrisMetadata(qris?: string | null): QrisMetadata {
  if (!qris || typeof qris !== 'string') {
    return { isValid: false, crcValid: false, isDynamic: false };
  }

  const cleaned = qris.trim();
  const tags = parseEmvTlv(cleaned);
  if (!tags || tags.length === 0) {
    return { isValid: false, crcValid: false, isDynamic: false };
  }

  const tagMap = new Map<string, string>();
  for (const entry of tags) {
    tagMap.set(entry.tag, entry.value);
  }

  const formatIndicator = tagMap.get('00');
  const initiationMethod = tagMap.get('01');
  const crcValid = verifyQrisCrc(cleaned);

  // Extract NMID from Tag 51 sub-tag 02 (National QRIS Merchant Account Info)
  let nmid: string | undefined;
  const tag51 = tagMap.get('51');
  if (tag51) {
    const subTags51 = parseEmvTlv(tag51);
    nmid = subTags51?.find((t) => t.tag === '02')?.value;
  }

  // Extract Acquirer domain from Tag 26..50 sub-tag 00
  let acquirerDomain: string | undefined;
  for (const entry of tags) {
    const tagNum = parseInt(entry.tag, 10);
    if (tagNum >= 26 && tagNum <= 50) {
      const subTags = parseEmvTlv(entry.value);
      const domain = subTags?.find((t) => t.tag === '00')?.value;
      if (domain) {
        acquirerDomain = domain;
        break;
      }
    }
  }

  const merchantName = tagMap.get('59');
  const merchantCity = tagMap.get('60');
  const postalCode = tagMap.get('61');
  const amountStr = tagMap.get('54');
  const parsedAmount = amountStr !== undefined ? Number(amountStr) : undefined;

  const isValid =
    formatIndicator === '01' &&
    crcValid &&
    Boolean(merchantName || nmid || acquirerDomain);

  return {
    isValid,
    crcValid,
    isDynamic: initiationMethod === '12',
    merchantName,
    merchantCity,
    postalCode,
    nmid,
    acquirerDomain,
    amount: Number.isFinite(parsedAmount) ? parsedAmount : undefined,
  };
}

/**
 * Converts a static (or existing) EMVCo QRIS payload into a Dynamic QRIS payload
 * with the exact Rupiah transaction amount embedded in Tag 54 and recalculated CRC16 Tag 63.
 */
export function generateDynamicQris(staticQris: string, amount: number): string {
  const cleaned = staticQris.trim();
  const roundedAmount = Math.round(Number(amount) || 0);

  if (!cleaned || roundedAmount <= 0) {
    return cleaned;
  }

  const parsedTags = parseEmvTlv(cleaned);
  if (!parsedTags || !verifyQrisCrc(cleaned)) {
    return cleaned;
  }

  // Filter out existing Tag 54 (Amount) and Tag 63 (CRC) before rebuilding
  const rebuiltTags: EmvTlvTag[] = [];
  let insertedAmount = false;
  const amountStr = String(roundedAmount);

  for (const entry of parsedTags) {
    if (entry.tag === '63' || entry.tag === '54') {
      continue;
    }

    // Update Point of Initiation Method (Tag 01) from Static ('11') to Dynamic ('12')
    if (entry.tag === '01') {
      rebuiltTags.push({ tag: '01', value: '12' });
      continue;
    }

    // Insert Tag 54 right before Tag 58 (Country Code) per EMVCo/BI QRIS standard ordering
    if (!insertedAmount && parseInt(entry.tag, 10) >= 58) {
      rebuiltTags.push({ tag: '54', value: amountStr });
      insertedAmount = true;
    }

    rebuiltTags.push(entry);
  }

  if (!insertedAmount) {
    rebuiltTags.push({ tag: '54', value: amountStr });
  }

  const payloadWithoutCrc = `${serializeEmvTlv(rebuiltTags)}6304`;
  const crc = computeCrc16Ccitt(payloadWithoutCrc);
  return `${payloadWithoutCrc}${crc}`;
}

/**
 * Resolves effective QRIS settings from CoopConfig with safe fallback to
 * Koperasi Amanah Baraya's official built-in QRIS poster and payload.
 */
export function resolveCoopQrisConfig(config?: Partial<CoopConfig> | null): ResolvedQrisConfig {
  const imageUrl =
    config?.qrisImageUrl && config.qrisImageUrl.trim().length > 0
      ? config.qrisImageUrl.trim()
      : DEFAULT_QRIS_IMAGE_URL;

  const staticPayload =
    config?.qrisStaticPayload !== undefined
      ? config.qrisStaticPayload.trim()
      : DEFAULT_QRIS_STATIC_PAYLOAD;

  const metadata = parseQrisMetadata(staticPayload);
  const hasValidPayload = metadata.isValid;

  const merchantName =
    config?.qrisMerchantName?.trim() ||
    metadata.merchantName ||
    DEFAULT_QRIS_MERCHANT_NAME;

  const nmid =
    config?.qrisNmid?.trim() ||
    metadata.nmid ||
    DEFAULT_QRIS_NMID;

  const preferredMode = config?.qrisDefaultMode === 'static' ? 'static' : 'dynamic';
  const defaultMode: 'dynamic' | 'static' = hasValidPayload ? preferredMode : 'static';

  return {
    imageUrl,
    staticPayload,
    merchantName,
    nmid,
    defaultMode,
    hasValidPayload,
    metadata,
  };
}
