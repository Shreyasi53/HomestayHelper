/**
 * Deterministic Pricing Calculator for Homestay Helper
 * 
 * Calculates recommended nightly rates purely using mathematical rules
 * based on room category, amenity count, and season.
 * Does NOT invoke any AI or LLMs.
 */

// Peak tourist season months in Darjeeling / Himalayan foothills:
// March (3), April (4), May (5), October (10), November (11)
export const PEAK_MONTHS = [3, 4, 5, 10, 11];

/**
 * Checks if a given date falls within peak tourist season.
 * @param {Date} [date=new Date()]
 * @returns {boolean}
 */
export function isPeakSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 1-indexed (1 = January, 12 = December)
  return PEAK_MONTHS.includes(month);
}

/**
 * Calculates deterministic off-peak and peak rate ranges.
 * 
 * @param {Object} options
 * @param {string} options.roomCategory - 'attached_bath' | 'shared_bath' | 'family_suite'
 * @param {number|Array} options.amenities - Array of amenity strings or number of amenities
 * @param {Date} [options.date=new Date()] - Optional date to check current season
 * @returns {Object} Calculated pricing data
 */
export function calculatePricing({ roomCategory = 'attached_bath', amenities = [], date = new Date() }) {
  const amenityCount = Array.isArray(amenities) ? amenities.length : Number(amenities || 0);

  // 1. Base rate by Room Category
  let baseRate = 1200; // Base rate in INR for standard shared bath
  if (roomCategory === 'attached_bath') {
    baseRate = 1600;
  } else if (roomCategory === 'family_suite') {
    baseRate = 2200;
  } else if (roomCategory === 'shared_bath') {
    baseRate = 1200;
  }

  // 2. Amenity factor: Each verified amenity adds fixed value
  const amenityValue = amenityCount * 150;
  const totalBase = baseRate + amenityValue;

  // 3. Off-Peak Rate calculation (rounded to nearest 50)
  const offPeakMin = Math.round((totalBase * 0.85) / 50) * 50;
  const offPeakMax = Math.round((totalBase * 1.05) / 50) * 50;

  // 4. Peak Tourist Season Rate calculation (rounded to nearest 50)
  const peakMin = Math.round((totalBase * 1.25) / 50) * 50;
  const peakMax = Math.round((totalBase * 1.55) / 50) * 50;

  const currentIsPeak = isPeakSeason(date);

  return {
    offPeak: `₹${offPeakMin} - ₹${offPeakMax}`,
    peak: `₹${peakMin} - ₹${peakMax}`,
    offPeakMin,
    offPeakMax,
    peakMin,
    peakMax,
    baseRate: totalBase,
    isPeakSeasonNow: currentIsPeak,
    currentSeasonName: currentIsPeak ? 'Peak Season' : 'Off-Peak Season',
    currentRate: currentIsPeak ? `₹${peakMin} - ₹${peakMax}` : `₹${offPeakMin} - ₹${offPeakMax}`
  };
}

export default calculatePricing;
