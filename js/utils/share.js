// Web Share & CSV Data Export Utility
class ShareUtils {
  /**
   * Triggers Web Share API or falls back to Clipboard Copy
   */
  static async shareText(title, text) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text
        });
        return true;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[Share] Web Share failed, falling back to copy:', err);
        } else {
          return false;
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      alert('Listing copied to clipboard! You can paste it in WhatsApp or SMS.');
      return true;
    } catch (err) {
      alert('Could not auto-copy. Please manually copy the text.');
      return false;
    }
  }

  /**
   * Exports Cash Ledger transactions to CSV file download
   */
  static exportLedgerCSV(transactions = []) {
    if (!transactions || transactions.length === 0) {
      alert('No ledger transactions to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount (INR)', 'Notes'];
    const rows = transactions.map(tx => [
      tx.id,
      tx.date,
      tx.type,
      `"${tx.category || ''}"`,
      tx.amount,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Homestay_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.ShareUtils = ShareUtils;
