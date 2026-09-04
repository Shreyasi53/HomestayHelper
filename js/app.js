// Main App Orchestrator & Router for Homestay Helper
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[App] Initializing Homestay Helper PWA...');

  // 1. Initialize IndexedDB Database
  try {
    await window.homestayDB.init();
    await seedInitialSampleData();
  } catch (err) {
    console.error('[App] Database init failed:', err);
  }

  // 2. Initialize UI Components
  window.appCommunicator = new window.CommunicatorComponent('communicatorContainer');
  window.appLedger = new window.LedgerComponent('ledgerContainer');
  window.appListing = new window.ListingComponent('listingContainer');
  window.appChecklist = new window.ChecklistComponent('checklistContainer');

  // Render initial components
  window.appCommunicator.render();
  window.appLedger.render();
  window.appListing.render();
  window.appChecklist.render();

  // 3. Bind Navigation Tabs
  bindNavigation();

  // 4. Register Offline Status Detector
  initOfflineDetector();

  // 5. Register Service Worker for PWA
  registerServiceWorker();
});

// Seed Initial Sample Data for Hackathon Demo
async function seedInitialSampleData() {
  const existingGuests = await window.homestayDB.getAllGuests();
  if (existingGuests.length === 0) {
    console.log('[App] Seeding sample hill homestay data...');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

    // Seed Sample Guest
    await window.homestayDB.saveGuest({
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
    await window.homestayDB.saveTransaction({
      id: 'tx_demo_1',
      date: today,
      type: 'INCOME',
      category: 'Room Rent',
      amount: 1000,
      notes: 'Advance booking payment from Rohan Banerjee'
    });

    await window.homestayDB.saveTransaction({
      id: 'tx_demo_2',
      date: today,
      type: 'EXPENSE',
      category: 'Groceries & Milk',
      amount: 450,
      notes: 'Bought fresh organic greens, milk & eggs for guest dinner'
    });
  }
}

// Tab Navigation Logic
function bindNavigation() {
  const tabs = document.querySelectorAll('.tab-btn, .bnav-item');

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetId = tab.getAttribute('data-tab');
      if (!targetId) return;

      // Update Active Classes
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.bnav-item').forEach(t => t.classList.remove('active'));

      document.querySelectorAll(`[data-tab="${targetId}"]`).forEach(t => t.classList.add('active'));

      // Switch Tab Panes
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      const activePane = document.getElementById(targetId);
      if (activePane) {
        activePane.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// Offline Status Detector
function initOfflineDetector() {
  const banner = document.getElementById('offlineBanner');
  const badgeText = document.getElementById('networkStatusText');

  function updateStatus() {
    const isOffline = !navigator.onLine;
    if (banner) {
      banner.style.display = isOffline ? 'flex' : 'none';
    }
    if (badgeText) {
      badgeText.textContent = isOffline ? 'Zero Bars (Offline)' : 'Online';
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

// PWA Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
      .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
  }
}
