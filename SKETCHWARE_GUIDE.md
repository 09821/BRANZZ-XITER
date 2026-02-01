# Guia de Integração Sketchware

Para validar a key gerada pelo bot no seu aplicativo Sketchware, você deve fazer uma requisição HTTP para o servidor onde o bot está rodando.

## 1. Endpoint de Validação
O bot expõe uma API no seguinte formato:
`http://SEU_IP_OU_DOMINIO:3000/validate/:key/:ip`

### Exemplo de Resposta:
- **Sucesso:** `{"valid": true}`
- **Falha:** `{"valid": false}`

## 2. Configuração no Sketchware

### Componentes Necessários:
1. **RequestNetwork:** Para fazer a chamada à API.
2. **EditText (Key):** Onde o usuário digita a chave.
3. **Botão (Validar):** Para iniciar o processo.

### Lógica no Evento do Botão:
Você precisará obter o IP do usuário. No Sketchware, você pode usar uma API externa (como `https://api.ipify.org`) para pegar o IP antes de validar a key.

**Passos:**
1. Use `RequestNetwork` para pegar o IP em `https://api.ipify.org`.
2. No evento `onResponse` do IP:
   - Salve o IP em uma variável.
   - Faça uma nova requisição para: `http://SEU_IP:3000/validate/` + `EditText_Key.getText()` + `/` + `Variável_IP`.
3. No evento `onResponse` da validação:
   - Use o bloco `Map` para converter o JSON.
   - Verifique se a chave `valid` é igual a `true`.
   - Se sim, libere o acesso ao App (mude de tela).
   - Se não, mostre uma mensagem de erro.

## 3. Segurança
Para evitar que as pessoas descubram o link da sua API facilmente, você pode usar um serviço como o **Cloudflare** ou ocultar a URL no código usando técnicas de ofuscação simples.
