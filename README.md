<p align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="4ward logo">
</p>

<h1 align="center">4ward</h1>

<p align="center">
  <strong>Transferência de texto segura via QR Code, sem precisar de rede.</strong>
</p>

---

O **4ward** transfere texto entre dispositivos sem conexão de rede. O texto é comprimido, criptografado com AES-GCM e exibido como QR Codes animados. No outro dispositivo, você digita a passphrase e escaneia o QR para reconstruir o texto original.

## Como funciona

1. **Enviar:** Digite o texto. Uma passphrase de 8 palavras é gerada. O QR Code animado aparece ao lado.
2. **Receber:** Digite a passphrase. Aponte a câmera para o QR Code. O texto aparece automaticamente.

Alternativamente, você pode copiar o código Base64 e colar no receptor.

## Por quê?

Profissionais de saúde às vezes usam blocos de nota online para transferir informações de pacientes sem proteção. O 4ward resolve isso: todo o processamento é local, nenhum dado sai do dispositivo.

## Tech Stack

- [Svelte 5](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Vite 8](https://vitejs.dev/)
- AES-GCM 256-bit via Web Crypto API
- [Fountain Codes](https://github.com/ngraveio/bc-ur) para QR sequencial
- PWA (instalável, funciona offline)

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```
