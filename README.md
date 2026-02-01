# 🤖 Bot de Vendas Discord + Validador de Key por IP

Este bot foi desenvolvido para gerenciar vendas automáticas no Discord, com sistema de tickets, categorias, itens e geração de chaves de licença vinculadas ao IP do comprador para uso em aplicativos externos (como Sketchware).

## 🚀 Funcionalidades

- **Gerenciamento de Estoque:** Comandos para adicionar categorias e itens com preço, estoque e link de download.
- **Sistema de Tickets:** Cria um canal privado para cada compra, onde o cliente envia o comprovante.
- **Aprovação Manual:** Comandos `/accept` e `/recuse` para o administrador gerenciar as vendas.
- **Segurança por IP:** Gera uma chave única que só funciona no IP detectado/informado no momento da aprovação.
- **API de Validação:** Servidor Express integrado para validar as chaves em tempo real.

## 🛠️ Comandos

- `/add_categoria [nome]`: Cria uma nova categoria de produtos.
- `/add_item [nome] [arquivo] [preco] [estoque] [pix] [categoria] [download]`: Adiciona um produto à loja.
- `/painel`: Envia a mensagem com o botão para abrir a loja.
- `/accept [usuario] [ip]`: Aprova a compra, gera a key e envia no PV do usuário.
- `/recuse [usuario] [motivo]`: Recusa a compra, avisa o usuário e fecha o ticket.

## 📦 Instalação

1. **Requisitos:** Node.js v16.x ou superior.
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure o arquivo `.env`:**
   ```env
   DISCORD_TOKEN=seu_token_aqui
   CLIENT_ID=id_do_seu_bot
   ```
4. **Registre os comandos Slash:**
   ```bash
   node deploy-commands.js
   ```
5. **Inicie o bot:**
   ```bash
   node index.js
   ```

## 🌐 Hospedagem 24/7

Para manter o bot online 24/7, recomenda-se o uso de uma VPS (como Google Cloud, AWS, Oracle Cloud) ou serviços como:
- **Railway.app**
- **Render.com**
- **SquareCloud** (Focado em bots de Discord)

Use o **PM2** para garantir que o bot reinicie se houver algum erro:
```bash
sudo npm install -g pm2
pm2 start index.js --name "vendas-bot"
```

## 📱 Integração Sketchware
Veja o arquivo `SKETCHWARE_GUIDE.md` para detalhes de como conectar seu app ao bot.
