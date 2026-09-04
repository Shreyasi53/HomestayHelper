// Component 3: AI Listing & Smart Pricing Assistant Component UI
class ListingComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.savedProfile = null;
    this.generatedOutput = null;
    this.pricingInfo = null;
  }

  async render() {
    this.savedProfile = await window.homestayDB.getListingProfile() || {
      name: "Maya's Tea Village Homestay",
      hostName: "Maya Gurung",
      village: "Takdah Cantonment",
      roomType: "attached_bath",
      roomCount: 2,
      amenities: ["Kanchenjunga View", "Organic Tea Tasting", "Home-cooked Meals", "Hot Bucket Water"]
    };

    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">
          <span>✨ AI Listing & Smart Pricing Helper</span>
          <span class="phrase-badge">On-Device AI</span>
        </div>
        <p class="card-subtitle">Create an attractive homestay description for guests & calculate optimal nightly pricing for your village.</p>

        <form id="formListingWizard">
          <div class="grid-2">
            <div class="form-group">
              <label>Homestay Name *</label>
              <input type="text" id="lstName" class="form-control" value="${this.savedProfile.name || ''}" placeholder="e.g. Maya's Tea Village Homestay" required>
            </div>
            <div class="form-group">
              <label>Host Name(s) *</label>
              <input type="text" id="lstHost" class="form-control" value="${this.savedProfile.hostName || ''}" placeholder="e.g. Maya & Karma Gurung" required>
            </div>
          </div>

          <div class="grid-3">
            <div class="form-group">
              <label>Village / Location *</label>
              <input type="text" id="lstVillage" class="form-control" value="${this.savedProfile.village || ''}" placeholder="e.g. Takdah, Mirik, Sourenee" required>
            </div>
            <div class="form-group">
              <label>Room Category</label>
              <select id="lstRoomType" class="form-select">
                <option value="attached_bath" ${this.savedProfile.roomType === 'attached_bath' ? 'selected' : ''}>Standard Attached Bath</option>
                <option value="shared_bath" ${this.savedProfile.roomType === 'shared_bath' ? 'selected' : ''}>Traditional Shared Bath</option>
                <option value="family_suite" ${this.savedProfile.roomType === 'family_suite' ? 'selected' : ''}>Family Suite (4 Bed)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Total Rooms Available</label>
              <input type="number" id="lstRoomCount" class="form-control" value="${this.savedProfile.roomCount || 1}" min="1" max="10">
            </div>
          </div>

          <div class="form-group">
            <label>Select Homestay Highlights & Amenities:</label>
            <div class="amenity-chip-grid">
              ${this._renderAmenityChip('Kanchenjunga View', '🏔')}
              ${this._renderAmenityChip('Organic Tea Tasting', '🍵')}
              ${this._renderAmenityChip('Home-cooked Meals', '🍲')}
              ${this._renderAmenityChip('Hot Bucket Water', '🚰')}
              ${this._renderAmenityChip('Evening Bonfire', '🔥')}
              ${this._renderAmenityChip('Tea Garden Trail Walk', '🌿')}
              ${this._renderAmenityChip('Solar Light Backup', '💡')}
              ${this._renderAmenityChip('Shared Cab Guidance', '🚘')}
            </div>
          </div>

          <button type="submit" id="btnGenerateListing" class="btn btn-primary btn-full" style="font-size:1rem; padding:0.9rem;">
            ✨ Generate AI Listing & Recommended Pricing
          </button>
        </form>
      </div>

      <!-- Result Display Area -->
      <div id="listingResultArea"></div>
    `;

    this._bindEvents();
  }

  _renderAmenityChip(name, icon) {
    const isChecked = (this.savedProfile.amenities || []).includes(name);
    const id = 'amn_' + name.replace(/\s+/g, '_');
    return `
      <input type="checkbox" id="${id}" class="chip-checkbox" value="${name}" ${isChecked ? 'checked' : ''}>
      <label for="${id}" class="chip-label">
        <span>${icon}</span> ${name}
      </label>
    `;
  }

  _getSelectedAmenities() {
    const checkboxes = this.container.querySelectorAll('.chip-checkbox:checked');
    return Array.from(checkboxes).map(c => c.value);
  }

  _bindEvents() {
    const form = document.getElementById('formListingWizard');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const profile = {
          name: document.getElementById('lstName').value.trim(),
          hostName: document.getElementById('lstHost').value.trim(),
          village: document.getElementById('lstVillage').value.trim(),
          roomType: document.getElementById('lstRoomType').value,
          roomCount: Number(document.getElementById('lstRoomCount').value || 1),
          amenities: this._getSelectedAmenities()
        };

        // Save to IndexedDB
        await window.homestayDB.saveListingProfile(profile);

        // Calculate Pricing
        this.pricingInfo = window.homestayAI.calculatePricing(profile.village, profile.roomType, profile.amenities);

        // Generate AI Listing Text
        this.generatedOutput = await window.homestayAI.generateListingText(profile);

        this.renderResults(profile);
      });
    }
  }

  renderResults(profile) {
    const resArea = document.getElementById('listingResultArea');
    if (!resArea || !this.generatedOutput) return;

    const textEN = typeof this.generatedOutput === 'string' ? this.generatedOutput : this.generatedOutput.en;
    const textHI = typeof this.generatedOutput === 'object' ? this.generatedOutput.hi : '';

    resArea.innerHTML = `
      <!-- Pricing Card -->
      <div class="card" style="border-left: 5px solid var(--accent);">
        <div class="card-title">
          <span>💡 Recommended Nightly Pricing Calculator</span>
        </div>
        <div class="grid-2">
          <div class="stat-card">
            <div class="label">Off-Peak Season Rate</div>
            <div class="val" style="color:var(--primary);">${this.pricingInfo.offPeak}</div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Includes stay + breakfast per night</p>
          </div>
          <div class="stat-card">
            <div class="label">Peak Tourist Season Rate (Mar-May & Oct-Nov)</div>
            <div class="val" style="color:var(--accent-hover);">${this.pricingInfo.peak}</div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">High demand timing</p>
          </div>
        </div>
      </div>

      <!-- Listing Copy Card -->
      <div class="card">
        <div class="card-title">
          <span>📢 Generated Homestay Listing Text</span>
          <button id="btnShareListing" class="btn btn-accent btn-sm">
            📲 Share / Copy Listing
          </button>
        </div>

        <div class="listing-output-card">
          <h4 style="color:var(--primary); margin-bottom:0.5rem;">English Version:</h4>
          <div class="listing-output-text">${textEN}</div>

          ${textHI ? `
            <hr style="margin:1rem 0; border:none; border-top:1px dashed #cbd5e1;">
            <h4 style="color:var(--primary); margin-bottom:0.5rem;">Hindi Version (हिंदी):</h4>
            <div class="listing-output-text">${textHI}</div>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('btnShareListing')?.addEventListener('click', async () => {
      const shareStr = `${textEN}\n\nRecommended Rate: ${this.pricingInfo.offPeak} per night.`;
      await window.ShareUtils.shareText(`${profile.name} - Homestay Listing`, shareStr);
    });

    resArea.scrollIntoView({ behavior: 'smooth' });
  }
}

window.ListingComponent = ListingComponent;
