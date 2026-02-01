const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('add_categoria')
        .setDescription('Adiciona uma nova categoria de vendas')
        .addStringOption(option => option.setName('nome').setDescription('Nome da categoria').setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('add_item')
        .setDescription('Adiciona um novo item para venda')
        .addStringOption(option => option.setName('nome').setDescription('Nome do item').setRequired(true))
        .addStringOption(option => option.setName('arquivo').setDescription('Nome do arquivo').setRequired(true))
        .addNumberOption(option => option.setName('preco').setDescription('Preço do item').setRequired(true))
        .addIntegerOption(option => option.setName('estoque').setDescription('Quantidade em estoque').setRequired(true))
        .addStringOption(option => option.setName('pix').setDescription('Chave PIX').setRequired(true))
        .addStringOption(option => option.setName('categoria').setDescription('Nome da categoria').setRequired(true))
        .addStringOption(option => option.setName('download').setDescription('Link de download').setRequired(true)),

    new SlashCommandBuilder()
        .setName('painel')
        .setDescription('Envia o painel de compras no canal atual'),

    new SlashCommandBuilder()
        .setName('accept')
        .setDescription('Aceita um pagamento e gera a key')
        .addUserOption(option => option.setName('usuario').setDescription('Usuário que comprou').setRequired(true))
        .addStringOption(option => option.setName('ip').setDescription('IP do usuário').setRequired(true)),

    new SlashCommandBuilder()
        .setName('recuse')
        .setDescription('Recusa um pagamento')
        .addUserOption(option => option.setName('usuario').setDescription('Usuário que comprou').setRequired(true))
        .addStringOption(option => option.setName('motivo').setDescription('Motivo da recusa').setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Iniciando atualização dos comandos Slash...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('Comandos Slash registrados com sucesso!');
    } catch (error) {
        console.error(error);
    }
})();
