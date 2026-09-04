// On-Device AI Generator & Smart Pricing Synthesizer
class HomestayAI {
  constructor() {
    this.hasChromeAI = typeof window !== 'undefined' && typeof window.ai !== 'undefined' && typeof window.ai.assistant !== 'undefined';
  }

  /**
   * Generates a polished homestay listing description in English and Hindi
   */
  async generateListingText(profile) {
    const { name, village, hostName, amenities = [], roomCount = 1 } = profile;

    // Check if Chrome AI Prompt API is available
    if (this.hasChromeAI) {
      try {
        const session = await window.ai.assistant.create();
        const prompt = `Write an inviting homestay listing for "${name}" hosted by ${hostName} in ${village} village near Darjeeling. Key amenities: ${amenities.join(', ')}. Mention home-cooked food, mountain views, and tea garden walks. Keep it under 100 words.`;
        const aiResponse = await session.prompt(prompt);
        session.destroy();
        if (aiResponse && aiResponse.trim().length > 20) {
          return {
            en: aiResponse.trim(),
            hi: ''
          };
        }
      } catch (err) {
        console.warn('[AI] Chrome Prompt API error, using local synthesizer fallback:', err);
      }
    }

    // Local Synthesizer Fallback (100% offline guaranteed)
    const amenityText = amenities.length > 0
      ? `Our home features ${amenities.join(', ')}.`
      : `Experience warm hill hospitality with home-cooked organic meals.`;

    const englishListing = `🏡 Welcome to ${name || 'Our Hill Homestay'}, hosted by ${hostName || 'our family'} in the scenic tea-garden village of ${village || 'Mirik'} near Darjeeling!

🌿 ${amenityText} We offer ${roomCount} cozy room(s) with clean linens, hot bucket baths, and traditional Nepalese Thali meals. Enjoy fresh morning Darjeeling First Flush tea with panoramic views of tea terraces and mountain peaks.

📍 Location: ${village || 'Darjeeling Hills'}
☕ Specialties: Fresh Organic Tea, Homemade Momos, Tea Garden Walks.
📞 Bookings & Inquiry: Contact host directly via cash/phone upon arrival.`;

    const hindiListing = `🏡 ${name || 'हमारे होमस्टे'} में आपका हार्दिक स्वागत है!
आयोजक: ${hostName || 'हमारा परिवार'} | स्थान: ${village || 'दार्जिलिंग पहाड़ी गाँव'}

🌿 सुविधाएं: ${amenities.length ? amenities.join(', ') : 'घर का बना शुद्ध भोजन, चाय बागान की सैर, गर्म पानी'}।
हमारे पास ${roomCount} आरामदायक कमरे हैं। रोज सुबह ताजा दार्जिलिंग फर्स्ट फ्लश चाय और कंचनजंगा के सुंदर दृश्य का आनंद लें।`;

    return {
      en: englishListing,
      hi: hindiListing
    };
  }

  /**
   * Calculates smart pricing recommendation (Min & Max rate per night)
   */
  calculatePricing(village, roomType, amenities = []) {
    let baseRate = 1200; // Base rate in INR

    // Village factor
    const touristVillages = ['darjeeling', 'mirik', 'kurseong', 'takdah', 'tinchuley', 'lava'];
    const vLower = (village || '').toLowerCase();
    if (touristVillages.some(v => vLower.includes(v))) {
      baseRate += 300;
    }

    // Room type factor
    if (roomType === 'attached_bath') baseRate += 400;
    if (roomType === 'family_suite') baseRate += 800;

    // Amenities factor (each amenity adds value)
    baseRate += (amenities.length * 150);

    const offPeakMin = Math.round(baseRate * 0.85 / 50) * 50;
    const offPeakMax = Math.round(baseRate * 1.05 / 50) * 50;
    const peakMin = Math.round(baseRate * 1.25 / 50) * 50;
    const peakMax = Math.round(baseRate * 1.55 / 50) * 50;

    return {
      offPeak: `₹${offPeakMin} - ₹${offPeakMax}`,
      peak: `₹${peakMin} - ₹${peakMax}`,
      suggestedBase: baseRate
    };
  }
}

export const homestayAI = new HomestayAI();
export default homestayAI;
