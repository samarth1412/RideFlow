const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

function timeSlotFromDate(d) {
  const h = d.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'late_night';
}

function normalize(v, min, max) {
  if (max === min) return 0.5;
  return (v - min) / (max - min);
}

async function getRecommendations(userId, opts = {}) {
  const limit = opts.limit || 8;
  const excludeRecentDays = opts.excludeRecentDays || 7;

  const user = await User.findById(userId).lean();
  if (!user) return { error: 'User not found' };

  // Load recent bookings
  const bookings = await Booking.find({
    user: userId,
    status: { $in: ['COMPLETED', 'CONFIRMED'] }
  }).populate('vehicle owner').sort({ bookingTime: -1 }).limit(200).lean();

  // Aggregations
  const typeCount = {};
  const locationCount = {};
  const slotCount = {};
  const prices = [];
  const recentVehicleIds = new Set();

  const recentThreshold = new Date(Date.now() - excludeRecentDays * 24 * 3600 * 1000);

  for (const b of bookings) {
    const v = b.vehicle || {};
    if (v.type) typeCount[v.type] = (typeCount[v.type] || 0) + 1;
    if (v.location) locationCount[v.location] = (locationCount[v.location] || 0) + 1;
    const slot = timeSlotFromDate(new Date(b.pickupDate || b.bookingTime || Date.now()));
    slotCount[slot] = (slotCount[slot] || 0) + 1;
    if (b.pricePerDay) prices.push(b.pricePerDay);
    if (b.bookingTime && new Date(b.bookingTime) > recentThreshold && v._id) {
      recentVehicleIds.add(String(v._id));
    }
  }

  // Preferred attributes
  const preferredType = Object.keys(typeCount).sort((a,b)=>typeCount[b]-typeCount[a])[0] || null;
  const preferredLocations = Object.keys(locationCount).sort((a,b)=>locationCount[b]-locationCount[a]).slice(0,3);
  const preferredSlot = Object.keys(slotCount).sort((a,b)=>slotCount[b]-slotCount[a])[0] || null;
  const avgPrice = prices.length ? prices.reduce((s,x)=>s+x,0)/prices.length : null;

  // Price range around avgPrice (if available)
  let minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER;
  if (avgPrice) {
    minPrice = Math.max(0, avgPrice * 0.6);
    maxPrice = avgPrice * 1.4;
  }

  // Build candidate query: active vehicles matching preferred type or location
  const query = { status: 'active' };
  const typeOrLocation = [];
  if (preferredType) typeOrLocation.push({ type: preferredType });
  if (preferredLocations.length) typeOrLocation.push({ location: { $in: preferredLocations } });
  if (typeOrLocation.length) query.$or = typeOrLocation;

  // Pull candidates and score them
  const candidates = await Vehicle.find(query).lean().limit(400);

  // Filter out vehicles with active confirmed bookings
  const currentDate = new Date();
  const activeBookings = await Booking.find({
    status: 'CONFIRMED',
    dropoffDate: { $gte: currentDate }
  }).select('vehicle').lean();
  
  const bookedVehicleIds = new Set(activeBookings.map(b => String(b.vehicle)));
  const availableCandidates = candidates.filter(v => !bookedVehicleIds.has(String(v._id)));

  // Determine price min/max among candidates for normalization
  let cMinPrice = Infinity, cMaxPrice = 0, cMaxRating = 0, cMaxCompleted = 0;
  for (const c of availableCandidates) {
    if (typeof c.pricePerDay === 'number') {
      cMinPrice = Math.min(cMinPrice, c.pricePerDay);
      cMaxPrice = Math.max(cMaxPrice, c.pricePerDay);
    }
    cMaxRating = Math.max(cMaxRating, c.rating || 0);
    cMaxCompleted = Math.max(cMaxCompleted, c.completedBookings || 0);
  }
  if (!isFinite(cMinPrice)) { cMinPrice = 0; cMaxPrice = 1; }

  const scored = [];
  for (const v of availableCandidates) {
    if (recentVehicleIds.has(String(v._id))) continue; // avoid repetitive suggestions

    // Basic matching features
    const matchLocation = preferredLocations.includes(v.location) ? 1 : 0;
    const matchType = preferredType && v.type === preferredType ? 1 : 0;

    const ratingScore = (v.rating || 0) / (cMaxRating || 5);
    const priceNorm = 1 - normalize(v.pricePerDay || 0, cMinPrice, cMaxPrice); // higher if cheaper
    const completedNorm = normalize(v.completedBookings || 0, 0, cMaxCompleted || 1);

    // Bonus if in same city as user
    const cityBonus = user.city && (v.location && v.location.toLowerCase().includes(user.city.toLowerCase())) ? 1 : 0;

    // Compute composite score
    const score = (ratingScore * 0.4) + (matchLocation * 0.2) + (matchType * 0.15) + (priceNorm * 0.15) + (completedNorm * 0.1) + (cityBonus * 0.1);

    const reasons = [];
    if (matchLocation) reasons.push('frequently used route/location');
    if (matchType) reasons.push('preferred vehicle type');
    if (cityBonus) reasons.push('near you');
    if ((v.rating || 0) >= 4) reasons.push('high-rated owner/vehicle');
    if (v.pricePerDay <= maxPrice && v.pricePerDay >= minPrice && avgPrice) reasons.push('within preferred price range');

    scored.push({ vehicle: v, score, reasons, matchedSlot: preferredSlot, avgPrice });
  }

  scored.sort((a,b)=>b.score-a.score);

  const top = scored.slice(0, limit).map(s => ({
    vehicle: s.vehicle,
    score: Number(s.score.toFixed(3)),
    reasons: s.reasons,
    preferredSlot: s.matchedSlot,
    estimatedPricePerDay: s.vehicle.pricePerDay,
  }));

  return {
    user: { id: user._id, city: user.city, preferredType, preferredLocations, preferredSlot },
    stats: { avgPrice },
    recommendations: top
  };
}

module.exports = { getRecommendations };
