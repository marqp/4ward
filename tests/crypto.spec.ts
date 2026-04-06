import { test, expect, describe } from 'vitest';
import { compressAndTokenize, decompressAndDetokenize } from '../src/lib/core/compression.ts';
import { encryptData, decryptData } from '../src/lib/core/crypto.ts';
import { FountainEncoder, FountainDecoder } from '../src/lib/core/ur.ts';
import { bytesToBase64, base64ToBytes, bytesToMnemonic, mnemonicToBytes } from '../src/lib/core/mnemonic.ts';
import { WORDLIST } from '../src/lib/core/wordlist.ts';

// ─── Original E2E tests ───

test('Full end-to-end encryption, encode, decode, and decryption', async () => {
  const textToSend = "paciente relata dor de cabeca e nega comorbidades";
  const words = [WORDLIST[0], WORDLIST[1], WORDLIST[2], WORDLIST[3]];

  const compressed = compressAndTokenize(textToSend);
  const payloadToSend = await encryptData(compressed, words);

  const encoder = new FountainEncoder(payloadToSend);

  const parts = [];
  for (let i = 0; i < 15; i++) {
    parts.push(encoder.nextPart());
  }

  const decoder = new FountainDecoder();
  let decodedPayload = null;
  for (const part of parts) {
    if (decoder.receivePart(part)) {
      decodedPayload = decoder.getResult();
      break;
    }
  }

  expect(decodedPayload).not.toBeNull();
  expect(decodedPayload).toBeInstanceOf(Uint8Array);

  console.log("Original payload size:", payloadToSend.length);
  console.log("Decoded payload size:", decodedPayload?.length);

  try {
    const decrypted = await decryptData(decodedPayload!, words);
    const receivedText = decompressAndDetokenize(decrypted);
    expect(receivedText).toBe(textToSend);
  } catch (err: any) {
    console.error(err);
    throw new Error("Falha na descriptografia: " + err.message);
  }
});

test('Large medical text with dictionary compression', async () => {
  const longText = `
    PACIENTE RELATA DOR PRECORDIAL DE INICIO SUBITO.
    NEGA COMORBIDADES PREVIAS. AO EXAME FISICO: BOM ESTADO GERAL, CORADO, HIDRATADO.
    AUSCULTA CARDIACA: RITMO REGULAR EM DOIS TEMPOS, BULHAS NORMOFONETICAS, SEM SOPROS.
    SINAIS VITAIS ESTAVEIS. PRESSAO ARTERIAL 120/80 MMHG. FREQUENCIA CARDIACA 80 BPM.
    CONDUTA MEDICA: SOLICITO AVALIACAO DA CARDIOLOGIA E EXAMES LABORATORIAIS.
    ESTAVEL NO MOMENTO. AGUARDAR EXAMES.
  `.repeat(10);

  const words = ["médico", "livro", "tempo", "espelho"];

  const compressed = compressAndTokenize(longText);
  console.log("Original Size:", new TextEncoder().encode(longText).length);
  console.log("Compressed Size:", compressed.length);

  expect(compressed.length).toBeLessThan(new TextEncoder().encode(longText).length / 2);

  const encrypted = await encryptData(compressed, words);
  const decrypted = await decryptData(encrypted, words);
  const decompressed = decompressAndDetokenize(decrypted);

  expect(decompressed).toBe(longText);
});

// ─── New tests ───

describe('Salt randomness', () => {
  test('encryptData produces different payloads with same passphrase (random salt)', async () => {
    const data = new TextEncoder().encode("teste de salt aleatoria");
    const passphrase = ["abacate", "abaixo", "abalar", "abater", "abduzir", "abelha"];

    const encrypted1 = await encryptData(data, passphrase);
    const encrypted2 = await encryptData(data, passphrase);

    // Payloads must differ because salt is random (first 16 bytes)
    expect(encrypted1).not.toEqual(encrypted2);

    // But both should decrypt to the same original data
    const decrypted1 = await decryptData(encrypted1, passphrase);
    const decrypted2 = await decryptData(encrypted2, passphrase);

    expect(decrypted1).toEqual(decrypted2);
    expect(decrypted1).toEqual(data);
  });

  test('encrypted payload starts with 16-byte salt + 12-byte IV', async () => {
    const data = new TextEncoder().encode("dados de teste");
    const passphrase = ["abacate", "abaixo", "abalar", "abater", "abduzir", "abelha"];
    const encrypted = await encryptData(data, passphrase);

    // Salt (16) + IV (12) + encrypted data
    expect(encrypted.length).toBeGreaterThan(28);

    // Two encryptions should have different salts (first 16 bytes)
    const encrypted2 = await encryptData(data, passphrase);
    const salt1 = encrypted.slice(0, 16);
    const salt2 = encrypted2.slice(0, 16);
    expect(salt1).not.toEqual(salt2);
  });
});

describe('Wrong passphrase handling', () => {
  test('decryption with wrong passphrase throws', async () => {
    const data = new TextEncoder().encode("dados secretos");
    const correctPassphrase = ["abacate", "abaixo", "abalar", "abater", "abduzir", "abelha"];
    const wrongPassphrase = ["espelho", "livro", "tempo", "casa", "rua", "fogo"];

    const encrypted = await encryptData(data, correctPassphrase);

    await expect(decryptData(encrypted, wrongPassphrase)).rejects.toThrow();
  });

  test('decryption with tampered payload throws', async () => {
    const data = new TextEncoder().encode("dados integros");
    const passphrase = ["abacate", "abaixo", "abalar", "abater", "abduzir", "abelha"];

    const encrypted = await encryptData(data, passphrase);

    // Tamper with a byte in the encrypted portion (after salt + iv)
    const tampered = new Uint8Array(encrypted);
    tampered[30] ^= 0xFF; // flip bits in first byte of ciphertext

    await expect(decryptData(tampered, passphrase)).rejects.toThrow();
  });
});

describe('Fountain encode/decode roundtrip', () => {
  test('single-part payload encodes and decodes correctly', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    const encoder = new FountainEncoder(data, 800);

    expect(encoder.isSinglePart()).toBe(true);

    const part = encoder.nextPart();
    const decoder = new FountainDecoder();
    decoder.receivePart(part);

    const result = decoder.getResult();
    expect(result).not.toBeNull();
    expect(result).toEqual(data);
  });

  test('multi-part fountain encode/decode preserves data', () => {
    // Create a payload large enough to need multiple parts
    const data = new Uint8Array(2000);
    for (let i = 0; i < data.length; i++) data[i] = i % 256;

    const encoder = new FountainEncoder(data, 800);
    expect(encoder.isSinglePart()).toBe(false);

    const decoder = new FountainDecoder();
    let result = null;

    // Feed parts until complete (fountain codes may need more than minimum)
    for (let i = 0; i < 50 && !result; i++) {
      const part = encoder.nextPart();
      if (decoder.receivePart(part)) {
        result = decoder.getResult();
      }
    }

    expect(result).not.toBeNull();
    expect(result).toEqual(data);
  });

  test('decoder reports progress while receiving parts', () => {
    const data = new Uint8Array(2000);
    for (let i = 0; i < data.length; i++) data[i] = i % 256;

    const encoder = new FountainEncoder(data, 800);
    const decoder = new FountainDecoder();

    // After first part, progress should be > 0
    const part1 = encoder.nextPart();
    decoder.receivePart(part1);
    expect(decoder.getEstimatedPercent()).toBeGreaterThan(0);

    // Before completion, result should be null
    expect(decoder.getResult()).toBeNull();
  });

  test('empty payload throws', () => {
    expect(() => new FountainEncoder(new Uint8Array(0), 800)).toThrow();
    expect(() => new FountainEncoder(new Uint8Array([]), 800)).toThrow();
  });
});

describe('Mnemonic encoding roundtrip', () => {
  test('bytesToMnemonic and mnemonicToBytes are inverses', () => {
    const testData = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE]);
    const mnemonic = bytesToMnemonic(testData);

    expect(mnemonic.length).toBeGreaterThan(0);
    expect(mnemonic.every(w => WORDLIST.includes(w))).toBe(true);

    const recovered = mnemonicToBytes(mnemonic);
    expect(recovered).toEqual(testData);
  });

  test('mnemonicToBytes throws on invalid word', () => {
    expect(() => mnemonicToBytes(["palavra_invalida_123", "abacate"])).toThrow(/palavra inv/i);
  });

  test('mnemonic uses only words from wordlist', () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(64));
    const mnemonic = bytesToMnemonic(randomBytes);
    for (const word of mnemonic) {
      expect(WORDLIST).toContain(word);
    }
  });
});

describe('Base64 utilities', () => {
  test('bytesToBase64 and base64ToBytes are inverses', () => {
    const original = new Uint8Array([1, 2, 3, 255, 254, 253, 0, 128, 64]);
    const b64 = bytesToBase64(original);
    const recovered = base64ToBytes(b64);
    expect(recovered).toEqual(original);
  });

  test('base64 roundtrip with larger data', () => {
    const data = new Uint8Array(500);
    for (let i = 0; i < data.length; i++) data[i] = i % 256;

    const b64 = bytesToBase64(data);
    const recovered = base64ToBytes(b64);
    expect(recovered).toEqual(data);
  });
});

describe('Compression edge cases', () => {
  test('empty string compression and decompression', () => {
    const empty = "";
    const compressed = compressAndTokenize(empty);
    const decompressed = decompressAndDetokenize(compressed);
    expect(decompressed).toBe(empty);
  });

  test('non-medical text compression', () => {
    const text = "The quick brown fox jumps over the lazy dog. Hello world!";
    const compressed = compressAndTokenize(text);
    const decompressed = decompressAndDetokenize(compressed);
    expect(decompressed).toBe(text);
  });

  test('unicode text (Portuguese) roundtrips', () => {
    const text = "Paciente relata dor de cabeça. Náuseas e vômitos. Exame cardíaco.";
    const compressed = compressAndTokenize(text);
    const decompressed = decompressAndDetokenize(compressed);
    expect(decompressed).toBe(text);
  });

  test('compression reduces size of repetitive medical text', () => {
    const text = "paciente relata dor ".repeat(100);
    const original = new TextEncoder().encode(text);
    const compressed = compressAndTokenize(text);
    expect(compressed.length).toBeLessThan(original.length);
    expect(decompressAndDetokenize(compressed)).toBe(text);
  });
});
