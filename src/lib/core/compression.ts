import { strToU8, deflateSync, inflateSync, strFromU8 } from 'fflate';
import { DICTIONARY_BIN } from './dictionary';

export function compressAndTokenize(text: string): Uint8Array {
  const uint8 = strToU8(text);
  // Usamos o dicionário nativo do deflate para máxima eficiência em textos médicos
  return deflateSync(uint8, { 
    level: 9, 
    dictionary: DICTIONARY_BIN 
  });
}

export function decompressAndDetokenize(data: Uint8Array): string {
  // O receptor deve usar exatamente o mesmo dicionário para conseguir inflar
  const inflated = inflateSync(data, { 
    dictionary: DICTIONARY_BIN 
  });
  return strFromU8(inflated);
}