require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('./database');
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const app = express();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

client.once('ready', () => {
    console.log(`Bot logado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // Comandos de gerenciamento (mantidos da versão anterior)
        if (commandName === 'add_categoria') {
            const nome = interaction.options.getString('nome');
            db.run("INSERT INTO categories (name) VALUES (?)", [nome], function(err) {
                if (err) return interaction.reply({ content: 'Erro ao adicionar categoria.', ephemeral: true });
                interaction.reply({ content: `Categoria **${nome}** adicionada!`, ephemeral: true });
            });
        }

        if (commandName === 'add_item') {
            const nome = interaction.options.getString('nome');
            const arquivo = interaction.options.getString('arquivo');
            const preco = interaction.options.getNumber('preco');
            const estoque = interaction.options.getInteger('estoque');
            const pix = interaction.options.getString('pix');
            const categoriaNome = interaction.options.getString('categoria');
            const download = interaction.options.getString('download');

            db.get("SELECT id FROM categories WHERE name = ?", [categoriaNome], (err, row) => {
                if (!row) return interaction.reply({ content: 'Categoria não encontrada!', ephemeral: true });
                db.run("INSERT INTO items (name, file_name, price, stock, pix_key, category_id, download_link) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [nome, arquivo, preco, estoque, pix, row.id, download], function(err) {
                        if (err) return interaction.reply({ content: 'Erro ao adicionar item.', ephemeral: true });
                        interaction.reply({ content: `Item **${nome}** adicionado!`, ephemeral: true });
                    });
            });
        }

        // NOVO COMANDO: Criar Painel Inicial
        if (commandName === 'painel') {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Central de Vendas')
                .setDescription('Clique no botão abaixo para explorar nossas categorias e produtos disponíveis.')
                .setColor('#5865F2')
                .setThumbnail(interaction.guild.iconURL());

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('abrir_categorias')
                        .setLabel('Ver Categorias')
                        .setEmoji('📁')
                        .setStyle(ButtonStyle.Primary),
                );

            await interaction.reply({ embeds: [embed], components: [row] });
        }

        if (commandName === 'accept') {
            const user = interaction.options.getUser('usuario');
            const ip = interaction.options.getString('ip');
            const key = crypto.randomBytes(8).toString('hex').toUpperCase();
            db.run("INSERT INTO sales (user_id, ip_address, license_key, status) VALUES (?, ?, ?, 'active')",
                [user.id, ip, key], async function(err) {
                    if (err) return interaction.reply({ content: 'Erro ao gerar key.', ephemeral: true });
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Pagamento Aprovado!')
                        .setDescription(`**Key:** \`${key}\`\n**IP:** \`${ip}\``)
                        .setColor('#00ff00');
                    await user.send({ embeds: [embed] }).catch(() => {});
                    interaction.reply({ content: `Aprovado para ${user.tag}.`, ephemeral: true });
                    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
                });
        }

        if (commandName === 'recuse') {
            const user = interaction.options.getUser('usuario');
            const motivo = interaction.options.getString('motivo');
            const embed = new EmbedBuilder()
                .setTitle('❌ Pagamento Recusado')
                .setDescription(`**Motivo:** ${motivo}`)
                .setColor('#ff0000');
            await user.send({ embeds: [embed] }).catch(() => {});
            interaction.reply({ content: `Recusado para ${user.tag}.`, ephemeral: true });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }
    }

    if (interaction.isButton()) {
        // Abrir Categorias
        if (interaction.customId === 'abrir_categorias') {
            db.all("SELECT * FROM categories", (err, rows) => {
                if (err || !rows || rows.length === 0) return interaction.reply({ content: 'Nenhuma categoria cadastrada.', ephemeral: true });

                const select = new StringSelectMenuBuilder()
                    .setCustomId('selecionar_categoria')
                    .setPlaceholder('Escolha uma categoria...')
                    .addOptions(rows.map(cat => ({
                        label: cat.name,
                        value: cat.id.toString(),
                        emoji: '📁'
                    })));

                const row = new ActionRowBuilder().addComponents(select);
                interaction.reply({ content: 'Selecione a categoria desejada:', components: [row], ephemeral: true });
            });
        }

        if (interaction.customId === 'fechar_ticket') {
            await interaction.reply('Fechando ticket...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }

    if (interaction.isStringSelectMenu()) {
        // Selecionar Categoria -> Mostrar Itens
        if (interaction.customId === 'selecionar_categoria') {
            const catId = interaction.values[0];
            db.all("SELECT * FROM items WHERE category_id = ?", [catId], (err, rows) => {
                if (err || !rows || rows.length === 0) return interaction.update({ content: 'Nenhum item nesta categoria.', components: [] });

                const select = new StringSelectMenuBuilder()
                    .setCustomId('selecionar_item')
                    .setPlaceholder('Escolha um item para comprar...')
                    .addOptions(rows.map(item => ({
                        label: item.name,
                        description: `R$ ${item.price.toFixed(2)} | Estoque: ${item.stock}`,
                        value: item.id.toString(),
                        emoji: '📦'
                    })));

                const row = new ActionRowBuilder().addComponents(select);
                interaction.update({ content: 'Selecione o item que deseja adquirir:', components: [row] });
            });
        }

        // Selecionar Item -> Criar Ticket Privado
        if (interaction.customId === 'selecionar_item') {
            const itemId = interaction.values[0];
            db.get("SELECT * FROM items WHERE id = ?", [itemId], async (err, item) => {
                if (!item) return interaction.reply({ content: 'Item não encontrado.', ephemeral: true });

                const guild = interaction.guild;
                const channel = await guild.channels.create({
                    name: `compra-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // Ninguém vê
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }, // Comprador vê
                        { id: guild.ownerId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }, // Dono do servidor vê
                    ],
                });

                const embed = new EmbedBuilder()
                    .setTitle('🛒 Ticket de Compra - ' + item.name)
                    .setDescription(`Olá ${interaction.user}, você iniciou o processo de compra.\n\n**Item:** ${item.name}\n**Valor:** R$ ${item.price.toFixed(2)}\n**Chave PIX:** \`${item.pix_key}\`\n\n**Instruções:**\n1. Realize o pagamento via PIX.\n2. Envie o **comprovante (foto/print)** aqui neste chat.\n3. Aguarde o dono do servidor verificar e aprovar.\n\n*Somente você e o dono do servidor têm acesso a este canal.*`)
                    .setColor('#FFFF00')
                    .setFooter({ text: 'ID do Item: ' + item.id });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('fechar_ticket')
                            .setLabel('Cancelar Compra')
                            .setStyle(ButtonStyle.Danger)
                    );

                await channel.send({ content: `<@${guild.ownerId}>, novo pedido de compra!`, embeds: [embed], components: [row] });
                interaction.update({ content: `✅ Ticket criado com sucesso: ${channel}`, components: [], ephemeral: true });
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

// API e Dashboard (mantidos)
app.use(express.json());
app.use(express.static(__dirname));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/api/categorias', (req, res) => db.all("SELECT * FROM categories", (err, rows) => res.json(rows || [])));
app.get('/api/itens', (req, res) => db.all("SELECT items.*, categories.name as cat_name FROM items JOIN categories ON items.category_id = categories.id", (err, rows) => res.json(rows || [])));
app.get('/api/vendas', (req, res) => db.all("SELECT * FROM sales", (err, rows) => res.json(rows || [])));
app.get('/validate/:key/:ip', (req, res) => {
    const { key, ip } = req.params;
    db.get("SELECT * FROM sales WHERE license_key = ? AND ip_address = ? AND status = 'active'", [key, ip], (err, row) => res.json({ valid: !!row }));
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
