// Native IndexedDB Storage Manager for Homestay Helper
const DB_NAME = 'HomestayHelperDB';
const DB_VERSION = 1;

class HomestayDB {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async init() {
    if (this.db) return this;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Guests Object Store
        if (!db.objectStoreNames.contains('guests')) {
          const guestStore = db.createObjectStore('guests', { keyPath: 'id' });
          guestStore.createIndex('status', 'status', { unique: false });
          guestStore.createIndex('checkIn', 'checkIn', { unique: false });
        }

        // Cash Ledger Transactions Store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('type', 'type', { unique: false });
          txStore.createIndex('date', 'date', { unique: false });
        }

        // Listing Profile Store
        if (!db.objectStoreNames.contains('listing')) {
          db.createObjectStore('listing', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[IndexedDB] Database initialized successfully');
        resolve(this);
      };

      request.onerror = (event) => {
        console.error('[IndexedDB] Error initializing database:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.initPromise;
  }

  // --- GUESTS CRUD ---
  async getAllGuests() {
    await this.init();
    return this._getAll('guests');
  }

  async saveGuest(guest) {
    await this.init();
    if (!guest.id) guest.id = 'gst_' + Date.now();
    return this._put('guests', guest);
  }

  async deleteGuest(id) {
    await this.init();
    return this._delete('guests', id);
  }

  // --- TRANSACTIONS CRUD ---
  async getAllTransactions() {
    await this.init();
    return this._getAll('transactions');
  }

  async saveTransaction(tx) {
    await this.init();
    if (!tx.id) tx.id = 'tx_' + Date.now();
    if (!tx.date) tx.date = new Date().toISOString().split('T')[0];
    return this._put('transactions', tx);
  }

  async deleteTransaction(id) {
    await this.init();
    return this._delete('transactions', id);
  }

  // --- LISTING PROFILE CRUD ---
  async getListingProfile() {
    await this.init();
    const list = await this._getAll('listing');
    return list.length > 0 ? list[0] : null;
  }

  async saveListingProfile(profile) {
    await this.init();
    profile.id = 'main_profile';
    return this._put('listing', profile);
  }

  // --- SEED SAMPLE DATA ---
  async seedInitialSampleData() {
    const existingGuests = await this.getAllGuests();
    if (existingGuests.length === 0) {
      console.log('[App] Seeding sample hill homestay data...');

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

      // Seed Sample Guest
      await this.saveGuest({
        id: 'gst_demo_1',
        name: 'Rohan Banerjee & Family',
        phone: '+91 98301 23456',
        roomNo: '101 (Kanchenjunga View)',
        checkIn: today,
        checkOut: tomorrow,
        totalAmount: 3600,
        advancePaid: 1000,
        status: 'Checked-in'
      });

      // Seed Sample Transactions
      await this.saveTransaction({
        id: 'tx_demo_1',
        date: today,
        type: 'INCOME',
        category: 'Room Rent',
        amount: 1000,
        notes: 'Advance booking payment from Rohan Banerjee'
      });

      await this.saveTransaction({
        id: 'tx_demo_2',
        date: today,
        type: 'EXPENSE',
        category: 'Groceries & Milk',
        amount: 450,
        notes: 'Bought fresh organic greens, milk & eggs for guest dinner'
      });
    }
  }

  // --- INTERNAL HELPER METHODS ---
  _getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  _put(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  _delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }
}

export const homestayDB = new HomestayDB();
export default homestayDB;
