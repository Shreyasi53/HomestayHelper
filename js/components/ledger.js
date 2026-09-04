// Component 2: Bookings & Cash Ledger Component
class LedgerComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.guests = [];
    this.transactions = [];
  }

  async render() {
    await this.loadData();

    const totalIncome = this.transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = this.transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netBalance = totalIncome - totalExpense;
    const activeGuestsCount = this.guests.filter(g => g.status === 'Checked-in').length;

    this.container.innerHTML = `
      <!-- Stats Summary Grid -->
      <div class="stats-summary">
        <div class="stat-card balance">
          <div class="label">Cash in Hand</div>
          <div class="val">₹${netBalance.toLocaleString()}</div>
        </div>
        <div class="stat-card income">
          <div class="label">Total Income</div>
          <div class="val">₹${totalIncome.toLocaleString()}</div>
        </div>
        <div class="stat-card expense">
          <div class="label">Total Expenses</div>
          <div class="val">₹${totalExpense.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label">Active Guests</div>
          <div class="val">${activeGuestsCount}</div>
        </div>
      </div>

      <!-- Action Buttons Bar -->
      <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-bottom:1.25rem;">
        <button id="btnOpenNewGuestModal" class="btn btn-primary">
          ➕ New Guest Booking
        </button>
        <button id="btnOpenNewTxModal" class="btn btn-secondary">
          💵 Log Income / Expense
        </button>
        <button id="btnExportCSV" class="btn btn-secondary" style="margin-left:auto;">
          📥 Export CSV Ledger
        </button>
      </div>

      <!-- Bookings Table Card -->
      <div class="card">
        <div class="card-title">
          <span>🛏 Active & Recent Guest Bookings</span>
          <span class="phrase-badge">${this.guests.length} Total</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Phone</th>
                <th>Dates</th>
                <th>Room #</th>
                <th>Total (INR)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.guests.length === 0 ? `
                <tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No guest bookings recorded yet. Tap "+ New Guest Booking" to add one.</td></tr>
              ` : this.guests.map(g => `
                <tr>
                  <td><strong>${g.name}</strong></td>
                  <td>${g.phone || '-'}</td>
                  <td>${g.checkIn} to ${g.checkOut}</td>
                  <td><span class="phrase-badge">Room ${g.roomNo}</span></td>
                  <td>₹${Number(g.totalAmount || 0).toLocaleString()}</td>
                  <td>
                    <span class="status-tag ${g.status === 'Checked-in' ? 'active' : 'completed'}">
                      ${g.status}
                    </span>
                  </td>
                  <td>
                    ${g.status === 'Checked-in' ? `
                      <button class="btn btn-sm btn-accent" onclick="appLedger.checkoutGuest('${g.id}')">Check-out</button>
                    ` : `
                      <button class="btn btn-sm btn-secondary" onclick="appLedger.deleteGuest('${g.id}')">Delete</button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transactions Log Card -->
      <div class="card">
        <div class="card-title">
          <span>🧾 Cash Register Transactions</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount (INR)</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.transactions.length === 0 ? `
                <tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No cash transactions logged yet.</td></tr>
              ` : this.transactions.map(t => `
                <tr>
                  <td>${t.date}</td>
                  <td>
                    <span class="status-tag ${t.type === 'INCOME' ? 'active' : 'cancelled'}">
                      ${t.type}
                    </span>
                  </td>
                  <td><strong>${t.category}</strong></td>
                  <td><strong>₹${Number(t.amount || 0).toLocaleString()}</strong></td>
                  <td>${t.notes || '-'}</td>
                  <td>
                    <button class="btn btn-sm btn-secondary" onclick="appLedger.deleteTx('${t.id}')">🗑</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal 1: Add Guest -->
      <div id="modalAddGuest" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>➕ Add New Guest Booking</h3>
            <button class="btn-close" onclick="appLedger.closeModals()">&times;</button>
          </div>
          <form id="formAddGuest">
            <div class="form-group">
              <label>Guest Full Name *</label>
              <input type="text" id="gName" class="form-control" placeholder="e.g. Rahul Sharma" required>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="gPhone" class="form-control" placeholder="e.g. 9876543210">
              </div>
              <div class="form-group">
                <label>Room Number / Name</label>
                <input type="text" id="gRoom" class="form-control" placeholder="e.g. 101 or Kanchenjunga View" required>
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Check-in Date *</label>
                <input type="date" id="gCheckIn" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Check-out Date *</label>
                <input type="date" id="gCheckOut" class="form-control" required>
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Total Rate (₹) *</label>
                <input type="number" id="gTotal" class="form-control" placeholder="e.g. 3000" required>
              </div>
              <div class="form-group">
                <label>Advance Paid (₹)</label>
                <input type="number" id="gAdvance" class="form-control" placeholder="e.g. 1000" value="0">
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
              <button type="button" class="btn btn-secondary" onclick="appLedger.closeModals()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Booking</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal 2: Add Transaction -->
      <div id="modalAddTx" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>💵 Log Cash Transaction</h3>
            <button class="btn-close" onclick="appLedger.closeModals()">&times;</button>
          </div>
          <form id="formAddTx">
            <div class="grid-2">
              <div class="form-group">
                <label>Transaction Type *</label>
                <select id="txType" class="form-select" required>
                  <option value="INCOME">INCOME (+ Cash Received)</option>
                  <option value="EXPENSE">EXPENSE (- Cash Spent)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Amount (₹) *</label>
                <input type="number" id="txAmount" class="form-control" placeholder="e.g. 500" required>
              </div>
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select id="txCategory" class="form-select" required>
                <option value="Room Rent">Room Rent / Booking</option>
                <option value="Meals & Drinks">Meals, Tea & Food</option>
                <option value="Firewood & Heating">Firewood & Heating</option>
                <option value="Groceries & Milk">Groceries & Milk</option>
                <option value="Shared Taxi / Transport">Shared Taxi / Transport</option>
                <option value="Other">Other Expense</option>
              </select>
            </div>
            <div class="form-group">
              <label>Notes / Description</label>
              <input type="text" id="txNotes" class="form-control" placeholder="e.g. Advance paid by Mr. Sharma">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
              <button type="button" class="btn btn-secondary" onclick="appLedger.closeModals()">Cancel</button>
              <button type="submit" class="btn btn-primary">Log Transaction</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  async loadData() {
    this.guests = await window.homestayDB.getAllGuests();
    this.transactions = await window.homestayDB.getAllTransactions();
    // Sort transactions by date descending
    this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async checkoutGuest(id) {
    const guest = this.guests.find(g => g.id === id);
    if (!guest) return;

    if (confirm(`Check-out guest ${guest.name}? This will record the final room rent income of ₹${guest.totalAmount} in your cash ledger.`)) {
      guest.status = 'Checked-out';
      await window.homestayDB.saveGuest(guest);

      // Auto log income transaction for stay if not already logged
      await window.homestayDB.saveTransaction({
        type: 'INCOME',
        category: 'Room Rent',
        amount: Number(guest.totalAmount || 0),
        notes: `Final settlement for guest ${guest.name} (Room ${guest.roomNo})`
      });

      this.render();
    }
  }

  async deleteGuest(id) {
    if (confirm('Are you sure you want to delete this guest record?')) {
      await window.homestayDB.deleteGuest(id);
      this.render();
    }
  }

  async deleteTx(id) {
    if (confirm('Delete this cash register transaction?')) {
      await window.homestayDB.deleteTransaction(id);
      this.render();
    }
  }

  closeModals() {
    document.getElementById('modalAddGuest')?.classList.remove('active');
    document.getElementById('modalAddTx')?.classList.remove('active');
  }

  _bindEvents() {
    // Open Modals
    document.getElementById('btnOpenNewGuestModal')?.addEventListener('click', () => {
      document.getElementById('modalAddGuest').classList.add('active');
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('gCheckIn').value = today;
      document.getElementById('gCheckOut').value = today;
    });

    document.getElementById('btnOpenNewTxModal')?.addEventListener('click', () => {
      document.getElementById('modalAddTx').classList.add('active');
    });

    // CSV Export
    document.getElementById('btnExportCSV')?.addEventListener('click', () => {
      window.ShareUtils.exportLedgerCSV(this.transactions);
    });

    // Submit Guest Form
    document.getElementById('formAddGuest')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const guest = {
        name: document.getElementById('gName').value.trim(),
        phone: document.getElementById('gPhone').value.trim(),
        roomNo: document.getElementById('gRoom').value.trim(),
        checkIn: document.getElementById('gCheckIn').value,
        checkOut: document.getElementById('gCheckOut').value,
        totalAmount: Number(document.getElementById('gTotal').value || 0),
        advancePaid: Number(document.getElementById('gAdvance').value || 0),
        status: 'Checked-in'
      };

      await window.homestayDB.saveGuest(guest);

      // Log advance if any
      if (guest.advancePaid > 0) {
        await window.homestayDB.saveTransaction({
          type: 'INCOME',
          category: 'Room Rent',
          amount: guest.advancePaid,
          notes: `Advance payment from guest ${guest.name}`
        });
      }

      this.closeModals();
      this.render();
    });

    // Submit Transaction Form
    document.getElementById('formAddTx')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tx = {
        type: document.getElementById('txType').value,
        amount: Number(document.getElementById('txAmount').value || 0),
        category: document.getElementById('txCategory').value,
        notes: document.getElementById('txNotes').value.trim()
      };

      await window.homestayDB.saveTransaction(tx);
      this.closeModals();
      this.render();
    });
  }
}

window.LedgerComponent = LedgerComponent;
