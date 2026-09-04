// Native IndexedDB Storage Manager for Homestay Helper
const DB_NAME = 'HomestayHelperDB';
const DB_VERSION = 1;

class HomestayDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
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
  }

  // --- GUESTS CRUD ---
  async getAllGuests() {
    return this._getAll('guests');
  }

  async saveGuest(guest) {
    if (!guest.id) guest.id = 'gst_' + Date.now();
    return this._put('guests', guest);
  }

  async deleteGuest(id) {
    return this._delete('guests', id);
  }

  // --- TRANSACTIONS CRUD ---
  async getAllTransactions() {
    return this._getAll('transactions');
  }

  async saveTransaction(tx) {
    if (!tx.id) tx.id = 'tx_' + Date.now();
    if (!tx.date) tx.date = new Date().toISOString().split('T')[0];
    return this._put('transactions', tx);
  }

  async deleteTransaction(id) {
    return this._delete('transactions', id);
  }

  // --- LISTING PROFILE CRUD ---
  async getListingProfile() {
    const list = await this._getAll('listing');
    return list.length > 0 ? list[0] : null;
  }

  async saveListingProfile(profile) {
    profile.id = 'main_profile';
    return this._put('listing', profile);
  }

  // --- INTERNAL HELPER METHODS ---
  _getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
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

window.homestayDB = new HomestayDB();
