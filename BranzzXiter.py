import discord
from discord.ext import commands
from discord import app_commands
import uuid

class SalesBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.all()
        super().__init__(command_prefix="!", intents=intents)

    async def setup_hook(self):
        await self.tree.sync()

bot = SalesBot()

# Banco de dados temporário (Em produção, use SQLite ou MongoDB)
estoque = {}
categorias = []

## --- COMANDOS DE ADMIN ---

@bot.tree.command(name="add_categoria", description="Adiciona uma nova categoria de vendas")
async def add_categoria(interaction: discord.Interaction, nome: str):
    if nome not in categorias:
        categorias.append(nome)
        estoque[nome] = []
        await interaction.response.send_message(f"✅ Categoria `{nome}` adicionada!")
    else:
        await interaction.response.send_message("❌ Categoria já existe.")

@bot.tree.command(name="add_item", description="Adiciona um item ao estoque")
async def add_item(interaction: discord.Interaction, categoria: str, nome: str, preco: float, estoque_qtd: int, pix: str, link_download: str):
    if categoria not in categorias:
        return await interaction.response.send_message("❌ Categoria não encontrada.")
    
    item = {
        "nome": nome,
        "preco": preco,
        "qtd": estoque_qtd,
        "pix": pix,
        "link": link_download,
        "vendedor_id": interaction.user.id
    }
    estoque[categoria].append(item)
    
    # Criar Painel de Compra
    embed = discord.Embed(title=f"🛒 Item: {nome}", description=f"Preço: R$ {preco}\nEstoque: {estoque_qtd}", color=0x00ff00)
    view = BuyView(item)
    await interaction.channel.send(embed=embed, view=view)
    await interaction.response.send_message("Item postado!", ephemeral=True)

## --- SISTEMA DE COMPRA E TICKET ---

class BuyView(discord.ui.View):
    def __init__(self, item):
        super().__init__(timeout=None)
        self.item = item

    @discord.ui.button(label="Comprar", style=discord.ButtonStyle.green, custom_id="buy_btn")
    async def buy(self, interaction: discord.Interaction):
        overwrites = {
            interaction.guild.default_role: discord.PermissionOverwrite(read_messages=False),
            interaction.user: discord.PermissionOverwrite(read_messages=True, send_messages=True)
        }
        ticket = await interaction.guild.create_text_channel(f"pagamento-{interaction.user.name}", overwrites=overwrites)
        
        embed = discord.Embed(title="Pagamento Pendente", description=f"Envie o comprovante para o item: **{self.item['nome']}**\n\n**Chave PIX:** `{self.item['pix']}`\n**Valor:** R$ {self.item['preco']}")
        await ticket.send(content=f"{interaction.user.mention}", embed=embed)
        await interaction.response.send_message(f"Ticket aberto: {ticket.mention}", ephemeral=True)

## --- COMANDOS DE VERIFICAÇÃO ---

@bot.tree.command(name="accept", description="Aceita o pagamento e entrega a key vinculada ao IP")
async def accept(interaction: discord.Interaction, usuario: discord.Member, link_ou_ip: str, download_link: str):
    # Gerar Key Única
    key = f"PRIME-{str(uuid.uuid4())[:8]}"
    
    # Aqui você salvaria no Firebase: Key + IP do Usuário
    # Firebase.child("Keys").child(key).set({"ip": link_ou_ip, "status": "active"})

    embed = discord.Embed(title="✅ Pagamento Aprovado!", color=0x00ff00)
    embed.add_field(name="Sua Key:", value=f"`{key}`", inline=False)
    embed.add_field(name="IP Vinculado:", value=link_ou_ip)
    embed.add_field(name="Download:", value=f"[Clique Aqui]({download_link})")
    
    await usuario.send(embed=embed)
    await interaction.response.send_message("Key entregue e canal será fechado em 10s.")

@bot.tree.command(name="recuse", description="Recusa o pagamento")
async def recuse(interaction: discord.Interaction, usuario: discord.Member, motivo: str):
    await usuario.send(f"❌ Seu pagamento foi recusado.\n**Motivo:** {motivo}")
    await interaction.channel.delete()

bot.run("SEU_TOKEN_AQUI")
