import { storage, uid } from './storage.js';
import { seedOrders } from './seed-data.js';

// Struktur order mengikuti tabel MySQL (orders + order_items). Harga disimpan sebagai snapshot.
// paymentStatus dan orderStatus dipisah. Semua status = SIMULASI (belum ada payment gateway).
export const PAY = { belum_bayar: ['Belum dibayar', 'warning'], menunggu_verifikasi: ['Menunggu verifikasi', 'warning'], terverifikasi: ['Terverifikasi', 'success'], ditolak: ['Ditolak', 'danger'], kedaluwarsa: ['Kedaluwarsa', 'danger'] };
export const ORDER = { baru: 'Baru', diproses: 'Diproses', selesai: 'Selesai', dibatalkan: 'Dibatalkan' };
export const MODEL = { langsung: 'Beli langsung di kantin', online: 'Pesan via website, ambil di kantin' };
export const payBadge = s => `<span class="badge ${PAY[s][1]}">${PAY[s][0]}</span>`;
export const fmtDate = iso => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const read = () => { const d = storage.get('orders', null); if (d) return d; const s = seedOrders(); storage.set('orders', s); return s; };
export const orderService = {
  async getAll() { return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async getById(id) { return read().find(o => o.id === id) || null; },
  async create({ buyerName, buyerContact, purchaseModel, items }) {
    const now = new Date(), d = now.toISOString().slice(2, 10).replaceAll('-', '');
    const order = {
      id: uid('ord'), code: `KJ-${d}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 15 * 60000).toISOString(),
      buyerName, buyerContact, purchaseModel, items, total: items.reduce((s, i) => s + i.price * i.qty, 0),
      paymentStatus: 'belum_bayar', orderStatus: 'baru', paymentRef: '', proofName: '',
    };
    storage.set('orders', [...read(), order]); return order;
  },
  async update(id, patch) { storage.set('orders', read().map(o => o.id === id ? { ...o, ...patch } : o)); return this.getById(id); },
};
