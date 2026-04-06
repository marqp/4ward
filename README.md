# 4ward 🚀

**4ward** é uma ferramenta de transferência de dados segura e *air-gapped* que utiliza QR Codes dinâmicos para mover informações entre dispositivos sem a necessidade de conexão com a rede (Internet, Bluetooth ou Wi-Fi).

## ✨ Funcionalidades

- 🔒 **Segurança Máxima:** Criptografia de ponta a ponta usando AES-GCM de 256 bits.
- 🔑 **Derivação de Chave Robusta:** PBKDF2 com 600.000 iterações e *salts* aleatórios.
- 🧩 **Protocolo UR (Uniform Resources):** Implementação de *Fountain Codes* que permite transferir grandes volumes de dados através de uma sequência infinita de QR Codes (podem ser lidos em qualquer ordem).
- 📉 **Compressão Inteligente:** Utiliza `fflate` com um dicionário customizado otimizado para textos estruturados, reduzindo drasticamente o tamanho dos QR Codes.
- 📱 **PWA (Progressive Web App):** Funciona totalmente offline e pode ser instalado no celular ou desktop.
- 🛡️ **Privacidade por Design:** Nenhum dado sai do dispositivo. Todo o processamento pesado ocorre em *Web Workers* para manter a interface fluida.

## 🛠️ Tech Stack

- **Framework:** [Svelte 5](https://svelte.dev/) (utilizando Runes para reatividade de ponta)
- **Linguagem:** TypeScript
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Build Tool:** Vite 8+
- **Protocolo de Dados:** [@ngraveio/bc-ur](https://github.com/ngrave/bc-ur)
- **Criptografia:** Web Crypto API
- **Compressão:** fflate

## 🚀 Como usar

1. **Enviar:** Digite ou cole o texto no editor, gere uma frase de segurança (passphrase) e exiba o QR Code dinâmico.
2. **Receber:** No outro dispositivo, abra o scanner, aponte para o QR Code e insira a frase de segurança correspondente para descriptografar os dados.

## 📦 Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Rodar em modo de desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

---

Desenvolvido com foco em segurança, privacidade e eficiência.
