const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sales.db');

db.serialize(() => {
    // Tabela de Categorias
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
    )`);

    // Tabela de Itens
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        file_name TEXT,
        price REAL,
        stock INTEGER,
        pix_key TEXT,
        category_id INTEGER,
        download_link TEXT,
        FOREIGN KEY(category_id) REFERENCES categories(id)
    )`);

    // Tabela de Vendas/Chaves
    db.run(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        user_id TEXT,
        ip_address TEXT,
        license_key TEXT UNIQUE,
        status TEXT,
        FOREIGN KEY(item_id) REFERENCES items(id)
    )`);
});

module.exports = db;
