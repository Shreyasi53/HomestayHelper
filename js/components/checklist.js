// Component 4: First-Time Host Checklist & Local Hill Guide Component UI
class ChecklistComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.checklistData = window.HOST_CHECKLIST || [];
    this.factsData = window.LOCAL_HILL_FACTS || [];
    this.completedIds = this._loadSavedState();
  }

  _loadSavedState() {
    try {
      const saved = localStorage.getItem('homestay_chk_state');
      return saved ? JSON.parse(saved) : ['room_1', 'room_3', 'hyg_2'];
    } catch (e) {
      return ['room_1'];
    }
  }

  _saveState() {
    localStorage.setItem('homestay_chk_state', JSON.stringify(this.completedIds));
  }

  render() {
    let totalItems = 0;
    this.checklistData.forEach(cat => totalItems += cat.items.length);
    const doneCount = this.completedIds.length;
    const progressPct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

    this.container.innerHTML = `
      <!-- Progress Bar Banner -->
      <div class="card" style="background: linear-gradient(135deg, #0f281e 0%, #1b4332 100%); color:#ffffff;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:700; color:#ffffff;">✅ Homestay Hosting Readiness</h3>
            <p style="font-size:0.85rem; color:#b7e4c7;">Preparation checklist for hosting guests comfortably.</p>
          </div>
          <div style="font-size:1.6rem; font-weight:700; color:var(--accent);">${progressPct}%</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
        </div>
        <p style="font-size:0.78rem; opacity:0.85; text-align:right;">${doneCount} of ${totalItems} items completed</p>
      </div>

      <!-- Interactive Checklist Categories -->
      <div class="grid-2">
        ${this.checklistData.map(cat => `
          <div class="card">
            <div class="card-title">
              <span>${cat.icon} ${cat.category}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.75rem;">
              ${cat.items.map(item => {
                const isChecked = this.completedIds.includes(item.id);
                return `
                  <label class="checklist-item ${isChecked ? 'done' : ''}" data-id="${item.id}">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="appChecklist.toggleItem('${item.id}')">
                    <span style="font-size:0.9rem; line-height:1.4;">${item.text}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Local Hill Lore & DHR Facts Cheat-sheet -->
      <div class="card" style="margin-top:1rem;">
        <div class="card-title">
          <span>📜 Local Hill & DHR Heritage Guide for Guests</span>
          <span class="phrase-badge">Storytelling</span>
        </div>
        <p class="card-subtitle">Share these authentic facts with guests during tea or dinner time!</p>

        <div class="grid-2">
          ${this.factsData.map(fact => `
            <div style="background:#f8fafc; padding:1rem; border-radius:var(--radius-sm); border-left:3px solid var(--primary-light);">
              <h4 style="font-size:0.95rem; color:var(--primary); font-weight:700; margin-bottom:0.35rem;">
                ${fact.title}
              </h4>
              <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">
                ${fact.fact}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  toggleItem(id) {
    if (this.completedIds.includes(id)) {
      this.completedIds = this.completedIds.filter(i => i !== id);
    } else {
      this.completedIds.push(id);
    }
    this._saveState();
    this.render();
  }
}

window.ChecklistComponent = ChecklistComponent;
