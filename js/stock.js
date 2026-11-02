import { storage, uid } from './storage.js';
import { productService } from './products.js';

// Semua perubahan stok lewat sini agar selalu tercatat di riwayat (UAS: tabel stock_movements)
export const stockService = {
  getLog: () => storage.get('stock_log', []),
  async change(productId, type, qty, note = '') {
    const p = await productService.getById(productId); if (!p) return null;
    const before = p.stock, after = type === 'masuk' ? before + qty : type === 'keluar' ? Math.max(0, before - qty) : qty;
    await productService.update(productId, { stock: after });
    storage.set('stock_log', [{ id: uid('stk'), productId, name: p.name, type, qty: Math.abs(after - before), before, after, note, at: new Date().toISOString() }, ...this.getLog()].slice(0, 500));
    return after;
  },
};
