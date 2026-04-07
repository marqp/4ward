import { test, expect, describe } from 'vitest';
import { encryptData, decryptData } from '../src/lib/core/crypto.ts';
import { FountainEncoder, FountainDecoder } from '../src/lib/core/ur.ts';
import { bytesToBase64, base64ToBytes, bytesToMnemonic, mnemonicToBytes } from '../src/lib/utils/encoding.ts';
import { WORDLIST } from '../src/lib/core/wordlist.ts';

// ─── Original E2E tests ───

test('Full end-to-end encryption, encode, decode, and decryption', async () => {
  const textToSend = "paciente relata dor de cabeca e nega comorbidades";
  const words = [WORDLIST[0], WORDLIST[1], WORDLIST[2], WORDLIST[3]];

  // Agora encryptData aceita string diretamente (comprime internamente)
  const payloadToSend = await encryptData(textToSend, words);

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
    // Agora decryptData retorna string diretamente (descomprime internamente)
    const receivedText = await decryptData(decodedPayload!, words);
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

  const originalSize = new TextEncoder().encode(longText).length;
  const encrypted = await encryptData(longText, words);
  
  // Encrypted size should still be much smaller than original due to internal compression
  // Salt (16) + IV (12) + Compressed Ciphertext
  console.log("Original Size:", originalSize);
  console.log("Encrypted (Compressed) Size:", encrypted.length);

  expect(encrypted.length).toBeLessThan(originalSize / 2);

  const decryptedText = await decryptData(encrypted, words);
  expect(decryptedText).toBe(longText);
});

// ─── New tests ───

describe('Salt randomness', () => {
  test('encryptData produces different payloads with same passphrase (random salt)', async () => {
    const text = "teste de salt aleatoria";
    const passphrase = ["abacate", "abaixo", "abalar", "abater", "abduzir", "abelha"];

    const encrypted1 = await encryptData(text, passphrase);
    const encrypted2 = await encryptData(text, passphrase);

    // Payloads must differ because salt is random (first 16 bytes)
    expect(encrypted1).not.toEqual(encrypted2);

    // But both should decrypt to the same original text
    const decrypted1 = await decryptData(encrypted1, passphrase);
    const decrypted2 = await decryptData(encrypted2, passphrase);

    expect(decrypted1).toEqual(decrypted2);
    expect(decrypted1).toEqual(text);
  });
});

describe('Wrong passphrase handling', () => {
  test('decryption with wrong passphrase throws', async () => {
    const text = "dados secretos";
    const correctPassphrase = ["abacate", "abaixo", "abalar", "abater", "abduzir", "abelha"];
    const wrongPassphrase = ["espelho", "livro", "tempo", "casa", "rua", "fogo"];

    const encrypted = await encryptData(text, correctPassphrase);

    await expect(decryptData(encrypted, wrongPassphrase)).rejects.toThrow();
  });

  test('decryption with tampered payload throws', async () => {
    const text = "dados integros";
    const passphrase = ["abacate", "abaixo", "abalar", "abater", "abduzir", "abelha"];

    const encrypted = await encryptData(text, passphrase);

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
    const data = new Uint8Array(2000);
    for (let i = 0; i < data.length; i++) data[i] = i % 256;

    const encoder = new FountainEncoder(data, 800);
    expect(encoder.isSinglePart()).toBe(false);

    const decoder = new FountainDecoder();
    let result = null;

    for (let i = 0; i < 50 && !result; i++) {
      const part = encoder.nextPart();
      if (decoder.receivePart(part)) {
        result = decoder.getResult();
      }
    }

    expect(result).not.toBeNull();
    expect(result).toEqual(data);
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
});

describe('Base64 utilities', () => {
  test('bytesToBase64 and base64ToBytes are inverses', () => {
    const original = new Uint8Array([1, 2, 3, 255, 254, 253, 0, 128, 64]);
    const b64 = bytesToBase64(original);
    const recovered = base64ToBytes(b64);
    expect(recovered).toEqual(original);
  });
});

describe('Integration: compress + encrypt + decrypt roundtrip', () => {
  test('full send/receive flow without external compression module', async () => {
    // Simula o fluxo real do app: texto → compress+encrypt → decrypt
    // O ReceiveModal usa decryptData diretamente (sem compression.ts)
    const originalText = `
      PACIENTE: João da Silva
      QUEIXA: Dor precordial súbita, irradiação para membro superior esquerdo
      HISTÓRICO: Hipertensão controlada, Diabetes tipo 2
      MEDICAÇÃO: Losartana 50mg, Metformina 850mg
      CONDUTA: Solicitado ECG, Troponina, Raio-X de tórax
    `.trim();

    const passphrase = ["médico", "livro", "tempo", "espelho", "casa", "rua", "fogo", "água"];

    // Send side: compressAndEncrypt (compression embutida no worker)
    const encrypted = await encryptData(originalText, passphrase);

    // Verify payload structure: salt(16) + iv(12) + ciphertext
    expect(encrypted.length).toBeGreaterThan(28);

    // Receive side: decryptData (decompression embutida no worker)
    // Este é o fluxo exato do ReceiveModal.svelte
    const decrypted = await decryptData(encrypted, passphrase);

    expect(decrypted).toBe(originalText);
  });

  test('encrypted payload size is reasonable for QR transmission', async () => {
    // Texto médico típico deve comprimir bem
    const medicalText = `Paciente relata dor de cabeça há 3 dias. Nega comorbidades. Ao exame físico: bom estado geral, corado, hidratado. PA: 120/80, FC: 80bpm.`.repeat(5);
    const passphrase = ["abacate", "abaixo", "abalar", "abater", "abduzir", "abelha", "aberto", "abismo"];

    const encrypted = await encryptData(medicalText, passphrase);
    const originalSize = new TextEncoder().encode(medicalText).length;

    // Compressão + overhead cripto (salt+iv+auth tag = 16+12+16 = 44 bytes)
    // Deve ser significativamente menor que o original para textos repetitivos
    expect(encrypted.length).toBeLessThan(originalSize);
    console.log(`Original: ${originalSize} bytes → Encrypted: ${encrypted.length} bytes (${((encrypted.length / originalSize) * 100).toFixed(1)}%)`);
  });
});
