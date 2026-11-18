import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_QRIS_IMAGE_URL,
  DEFAULT_QRIS_MERCHANT_NAME,
  DEFAULT_QRIS_NMID,
  DEFAULT_QRIS_STATIC_PAYLOAD,
  computeCrc16Ccitt,
  verifyQrisCrc,
  parseQrisMetadata,
  generateDynamicQris,
  resolveCoopQrisConfig,
} from './qrisDynamic';

test('default Koperasi Amanah Baraya QRIS payload passes CRC-16/CCITT-FALSE verification', () => {
  assert.equal(verifyQrisCrc(DEFAULT_QRIS_STATIC_PAYLOAD), true);
  const withoutCrc = DEFAULT_QRIS_STATIC_PAYLOAD.slice(0, -4);
  assert.equal(computeCrc16Ccitt(withoutCrc), '72EF');
});

test('parseQrisMetadata extracts authentic Bank BSI Koperasi Amanah Baraya metadata', () => {
  const meta = parseQrisMetadata(DEFAULT_QRIS_STATIC_PAYLOAD);
  assert.equal(meta.isValid, true);
  assert.equal(meta.crcValid, true);
  assert.equal(meta.isDynamic, false);
  assert.equal(meta.merchantName, 'KOPERASI AMANAH BARAYA');
  assert.equal(meta.merchantCity, 'SUKABUMI');
  assert.equal(meta.postalCode, '43169');
  assert.equal(meta.nmid, 'ID1026582785279');
  assert.equal(meta.acquirerDomain, 'ID.CO.BANKBSI.WWW');
  assert.equal(meta.amount, undefined);
});

test('generateDynamicQris embeds exact transaction amount with Tag 01=12 and valid CRC16', () => {
  const amounts = [5000, 37500, 1250000];
  for (const amount of amounts) {
    const dynamicQris = generateDynamicQris(DEFAULT_QRIS_STATIC_PAYLOAD, amount);
    assert.ok(dynamicQris.startsWith('000201010212'), `Expected dynamic header for ${amount}`);
    assert.equal(verifyQrisCrc(dynamicQris), true, `CRC must be valid for ${amount}`);

    const meta = parseQrisMetadata(dynamicQris);
    assert.equal(meta.isValid, true);
    assert.equal(meta.isDynamic, true);
    assert.equal(meta.amount, amount);
    assert.equal(meta.merchantName, 'KOPERASI AMANAH BARAYA');
    assert.equal(meta.nmid, 'ID1026582785279');
    assert.equal(meta.merchantCity, 'SUKABUMI');
  }
});

test('generateDynamicQris handles zero/negative amounts, decimal rounding, and re-generating from dynamic payload', () => {
  // Zero or negative amount leaves static QRIS untouched
  assert.equal(generateDynamicQris(DEFAULT_QRIS_STATIC_PAYLOAD, 0), DEFAULT_QRIS_STATIC_PAYLOAD);
  assert.equal(generateDynamicQris(DEFAULT_QRIS_STATIC_PAYLOAD, -500), DEFAULT_QRIS_STATIC_PAYLOAD);

  // Rounds fractional amount to nearest integer Rupiah
  const rounded = generateDynamicQris(DEFAULT_QRIS_STATIC_PAYLOAD, 12499.6);
  assert.equal(parseQrisMetadata(rounded).amount, 12500);
  assert.equal(verifyQrisCrc(rounded), true);

  // Re-generating with a new amount replaces Tag 54 cleanly without duplicating
  const updated = generateDynamicQris(rounded, 45000);
  assert.equal(parseQrisMetadata(updated).amount, 45000);
  assert.equal(verifyQrisCrc(updated), true);
  assert.equal(updated, generateDynamicQris(DEFAULT_QRIS_STATIC_PAYLOAD, 45000));
});

test('verifyQrisCrc rejects tampered or malformed payloads', () => {
  const tampered = DEFAULT_QRIS_STATIC_PAYLOAD.slice(0, -1) + '0';
  assert.equal(verifyQrisCrc(tampered), false);
  assert.equal(parseQrisMetadata(tampered).isValid, false);
  assert.equal(parseQrisMetadata('not-a-qris').isValid, false);
  assert.equal(parseQrisMetadata('').isValid, false);
});

test('resolveCoopQrisConfig falls back to official Koperasi Amanah Baraya QRIS when cloud config lacks QRIS fields', () => {
  const resolved = resolveCoopQrisConfig({ name: 'KOPERASI AMANAH BARAYA' });
  assert.equal(resolved.imageUrl, DEFAULT_QRIS_IMAGE_URL);
  assert.equal(resolved.staticPayload, DEFAULT_QRIS_STATIC_PAYLOAD);
  assert.equal(resolved.merchantName, DEFAULT_QRIS_MERCHANT_NAME);
  assert.equal(resolved.nmid, DEFAULT_QRIS_NMID);
  assert.equal(resolved.defaultMode, 'dynamic');
  assert.equal(resolved.hasValidPayload, true);

  // Respects static mode preference and custom image without payload
  const staticOnly = resolveCoopQrisConfig({
    qrisImageUrl: 'https://example.com/custom-qris.png',
    qrisStaticPayload: '',
    qrisDefaultMode: 'static',
  });
  assert.equal(staticOnly.imageUrl, 'https://example.com/custom-qris.png');
  assert.equal(staticOnly.hasValidPayload, false);
  assert.equal(staticOnly.defaultMode, 'static');
});
