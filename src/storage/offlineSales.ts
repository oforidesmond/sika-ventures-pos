import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { CartItem, Sale } from '../types/sales';

const DB_STORAGE_KEY = 'sika_offline_sales_db';
// Use a relative path so it works in Vite dev (http://localhost:3000)
// and in the packaged Electron app (file://.../build/).
const SQL_WASM_PATH = 'sql-wasm.wasm';

let dbPromise: Promise<Database> | null = null;

const uint8ToBase64 = (buffer: Uint8Array) => {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
};

const base64ToUint8 = (base64: string) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const persistDatabase = (db: Database) => {
  const data = db.export();
  const base64 = uint8ToBase64(data);
  localStorage.setItem(DB_STORAGE_KEY, base64);
};

const ensureTables = (db: Database) => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      receiptNumber TEXT,
      userId TEXT,
      subtotal REAL,
      discount REAL,
      totalAmount REAL,
      paymentMethod TEXT,
      customerName TEXT,
      date TEXT,
      time TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      saleId TEXT,
      productId TEXT,
      name TEXT,
      quantity INTEGER,
      price REAL,
      total REAL,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
    );
  `);
};

const getDatabase = async (): Promise<Database> => {
  if (!dbPromise) {
    dbPromise = initSqlJs({ locateFile: () => SQL_WASM_PATH }).then((SQLModule: SqlJsStatic) => {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      const db = stored ? new SQLModule.Database(base64ToUint8(stored)) : new SQLModule.Database();
      ensureTables(db);
      if (!stored) {
        persistDatabase(db);
      }
      return db;
    });
  }
  return dbPromise;
};

const buildSaleFromRow = (row: Record<string, unknown>, items: CartItem[]): Sale => ({
  id: String(row.id),
  receiptNumber: String(row.receiptNumber),
  userId: String(row.userId),
  subtotal: Number(row.subtotal ?? 0),
  discount: Number(row.discount ?? 0),
  totalAmount: Number(row.totalAmount ?? 0),
  paymentMethod: row.paymentMethod as Sale['paymentMethod'],
  customerName: row.customerName ? String(row.customerName) : undefined,
  date: String(row.date ?? ''),
  time: String(row.time ?? ''),
  items,
  synced: Number(row.synced ?? 0) === 1,
});

const getSaleItems = (db: Database, saleId: string): CartItem[] => {
  const stmt = db.prepare('SELECT * FROM sale_items WHERE saleId = ?');
  const items: CartItem[] = [];
  stmt.bind([saleId]);
  while (stmt.step()) {
    const row = stmt.getAsObject();
    items.push({
      id: String(row.productId),
      name: String(row.name ?? ''),
      price: Number(row.price ?? 0),
      quantity: Number(row.quantity ?? 0),
    });
  }
  stmt.free();
  return items;
};

export const saveSaleOffline = async (sale: Sale) => {
  const db = await getDatabase();
  const insertSale = db.prepare(`
    INSERT OR REPLACE INTO sales (
      id, receiptNumber, userId, subtotal, discount, totalAmount,
      paymentMethod, customerName, date, time, synced, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  insertSale.run([
    sale.id,
    sale.receiptNumber,
    sale.userId,
    sale.subtotal,
    sale.discount ?? 0,
    sale.totalAmount,
    sale.paymentMethod,
    sale.customerName ?? null,
    sale.date,
    sale.time,
    sale.synced ? 1 : 0,
    new Date().toISOString(),
  ]);
  insertSale.free();

  db.run('DELETE FROM sale_items WHERE saleId = ?;', [sale.id]);
  const insertItem = db.prepare(`
    INSERT INTO sale_items (id, saleId, productId, name, quantity, price, total)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `);

  sale.items.forEach((item, index) => {
    insertItem.run([
      `${sale.id}-item-${index}`,
      sale.id,
      item.id,
      item.name,
      item.quantity,
      item.price,
      item.price * item.quantity,
    ]);
  });
  insertItem.free();

  persistDatabase(db);
};

export const getAllSales = async (): Promise<Sale[]> => {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM sales ORDER BY datetime(createdAt) DESC;');
  const sales: Sale[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const items = getSaleItems(db, String(row.id));
    sales.push(buildSaleFromRow(row, items));
  }
  stmt.free();
  return sales;
};

export const getPendingSales = async (): Promise<Sale[]> => {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM sales WHERE synced = 0 ORDER BY datetime(createdAt) ASC;');
  const sales: Sale[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const items = getSaleItems(db, String(row.id));
    sales.push(buildSaleFromRow(row, items));
  }
  stmt.free();
  return sales;
};

export const markSaleSynced = async (saleId: string) => {
  const db = await getDatabase();
  db.run('UPDATE sales SET synced = 1 WHERE id = ?;', [saleId]);
  persistDatabase(db);
};

export const deleteSale = async (saleId: string) => {
  const db = await getDatabase();
  db.run('DELETE FROM sale_items WHERE saleId = ?;', [saleId]);
  db.run('DELETE FROM sales WHERE id = ?;', [saleId]);
  persistDatabase(db);
};

export const getPendingSalesCount = async (): Promise<number> => {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM sales WHERE synced = 0;');
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  return Number(row.count ?? 0);
};
