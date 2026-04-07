import { UR, UREncoder, URDecoder } from '@ngraveio/bc-ur';
import { Buffer } from 'buffer';

// Margem de segurança para o overhead de codificação CBOR e prefixos UR (ur:bytes/...)
const UR_OVERHEAD_SAFETY_MARGIN = 100;

export class FountainEncoder {
  private encoder: UREncoder;
  private _isSinglePart: boolean;

  constructor(payload: Uint8Array, fragmentSize: number = 1000) {
    if (!payload || payload.length === 0) {
      throw new Error("Payload vazio passado para o codificador UR");
    }
    
    try {
      const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
      const ur = UR.fromBuffer(buf);
      this.encoder = new UREncoder(ur, fragmentSize);
      
      // No bc-ur, se o tamanho do CBOR for menor que o fragmentSize, é parte única
      this._isSinglePart = buf.length < (fragmentSize - UR_OVERHEAD_SAFETY_MARGIN);
    } catch (err: any) {
      console.error("Erro interno no UR encoder:", err);
      throw new Error("Falha ao inicializar codificador Fountain: " + err.message);
    }
  }

  isSinglePart(): boolean {
    return this._isSinglePart;
  }

  nextPart(): string {
    // Retornamos em MAIÚSCULAS para disparar o modo Alfanumérico do QR Code
    return this.encoder.nextPart().toUpperCase();
  }
}

export class FountainDecoder {
  private decoder: URDecoder;

  constructor() {
    this.decoder = new URDecoder();
  }

  receivePart(part: string): boolean {
    try {
      // bc-ur expects lowercase, we receive uppercase for QR optimization
      this.decoder.receivePart(part.toLowerCase().trim());
      return this.decoder.isComplete() && this.decoder.isSuccess();
    } catch {
      return false;
    }
  }

  getEstimatedPercent(): number {
    return this.decoder.estimatedPercentComplete();
  }

  getProgress(): number {
    try {
      return this.decoder.getProgress ? this.decoder.getProgress() : 0;
    } catch { return 0; }
  }

  getTotalFragments(): number {
    try {
      // URDecoder exposes expectedPartIndexes() which returns an array
      const indexes = this.decoder.expectedPartIndexes ? this.decoder.expectedPartIndexes() : [];
      return Array.isArray(indexes) ? indexes.length : 0;
    } catch { return 0; }
  }

  getReceivedFragments(): number {
    try {
      const indexes = this.decoder.receivedPartIndexes ? this.decoder.receivedPartIndexes() : [];
      return Array.isArray(indexes) ? indexes.length : 0;
    } catch { return 0; }
  }

  getResult(): Uint8Array | null {
    if (this.decoder.isComplete() && this.decoder.isSuccess()) {
      const ur = this.decoder.resultUR();
      const decoded = ur.decodeCBOR() as any;
      
      if (decoded instanceof Uint8Array) {
        return decoded;
      }
      
      if (decoded && decoded.type === 'Buffer' && Array.isArray(decoded.data)) {
        return new Uint8Array(decoded.data);
      }

      if (decoded && typeof decoded === 'object' && decoded.buffer instanceof ArrayBuffer) {
        return new Uint8Array(decoded.buffer, decoded.byteOffset, decoded.byteLength);
      }
      
      return new Uint8Array(decoded);
    }
    return null;
  }
  
  getError(): string | null {
    if (this.decoder.isError()) {
      return this.decoder.resultError();
    }
    return null;
  }
}