# RideShareX Recommendation System

## Overview

The RideShareX Recommendation System is an intelligent vehicle suggestion engine that provides personalized vehicle recommendations to users based on their booking history, preferences, and behavioral patterns. The system uses a sophisticated scoring algorithm to match users with the most suitable vehicles available on the platform.

## Table of Contents

1. [How It Works](#how-it-works)
2. [Algorithm Architecture](#algorithm-architecture)
3. [API Endpoints](#api-endpoints)
4. [Scoring System](#scoring-system)
5. [Features & Capabilities](#features--capabilities)
6. [Implementation Details](#implementation-details)
7. [Usage Examples](#usage-examples)
8. [Customization Options](#customization-options)

---

## How It Works

The recommendation system analyzes a user's historical booking data to understand their preferences and suggests vehicles that match their patterns. The process involves:

1. **Data Collection**: Gathering completed and confirmed bookings for the user
2. **Pattern Analysis**: Identifying preferences for vehicle types, locations, time slots, and price ranges
3. **Candidate Selection**: Finding active vehicles that match preferred criteria
4. **Intelligent Scoring**: Ranking candidates using a multi-factor scoring algorithm
5. **Result Delivery**: Returning top-scored vehicles with explanations

---

## Algorithm Architecture

### 1. User Preference Extraction

The system analyzes up to **200 recent bookings** to extract:

- **Preferred Vehicle Type**: Most frequently booked vehicle category (Car, Bike, SUV, etc.)
- **Preferred Locations**: Top 3 most frequently used locations
- **Preferred Time Slot**: Most common booking time (Morning, Afternoon, Evening, Late Night)
- **Average Price Point**: Mean price per day from historical bookings
- **Recent Vehicles**: Tracks recently booked vehicles to avoid repetitive suggestions

### 2. Time Slot Classification

Bookings are categorized into 4 time slots based on pickup time:

| Time Slot | Hours |
|-----------|-------|
| Morning | 5:00 AM - 10:59 AM |
| Afternoon | 11:00 AM - 4:59 PM |
| Evening | 5:00 PM - 9:59 PM |
| Late Night | 10:00 PM - 4:59 AM |

### 3. Candidate Filtering

The system applies multiple filters to ensure quality recommendations:

- ✅ Only **active vehicles** are considered
- ✅ Vehicles matching preferred type OR location
- ✅ Excludes vehicles with active confirmed bookings
- ✅ Excludes vehicles booked by the user in the last **7 days** (configurable)
- ✅ Limits candidates to **400 vehicles** for performance

---

## Scoring System

Each candidate vehicle receives a composite score (0-1 range) based on weighted factors:

### Score Components

| Factor | Weight | Description |
|--------|--------|-------------|
| **Rating Score** | 40% | Vehicle/owner rating normalized against max rating |
| **Location Match** | 20% | Bonus if location matches user's frequent routes |
| **Type Match** | 15% | Bonus if vehicle type matches user's preference |
| **Price Score** | 15% | Higher score for vehicles closer to user's avg price (cheaper preferred) |
| **Booking History** | 10% | Bonus for vehicles with more completed bookings |
| **City Proximity** | 10% | Bonus if vehicle is in user's city |

### Score Formula

```
score = (ratingScore × 0.4) + 
        (matchLocation × 0.2) + 
        (matchType × 0.15) + 
        (priceNorm × 0.15) + 
        (completedNorm × 0.1) + 
        (cityBonus × 0.1)
```

### Price Range Logic

The system determines a comfortable price range based on historical average:

- **Minimum Price**: `avgPrice × 0.6` (60% of average)
- **Maximum Price**: `avgPrice × 1.4` (140% of average)

Vehicles within this range receive a "within preferred price range" reason tag.

---

## API Endpoints

### Get Recommendations

**Endpoint**: `GET /api/recommendations`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | String | Yes | - | MongoDB ObjectId of the user |
| `limit` | Integer | No | 8 | Number of recommendations to return |

#### Alternative Endpoint

**Endpoint**: `GET /api/recommendations/:userId`

#### Request Examples

```bash
# Query parameter approach
GET /api/recommendations?userId=6523abc123def456789&limit=5

# Path parameter approach
GET /api/recommendations/6523abc123def456789?limit=10
```

#### Response Structure

```json
{
  "user": {
    "id": "6523abc123def456789",
    "city": "New York",
    "preferredType": "Car",
    "preferredLocations": ["Downtown", "Airport", "Central Park"],
    "preferredSlot": "evening"
  },
  "stats": {
    "avgPrice": 45.50
  },
  "recommendations": [
    {
      "vehicle": {
        "_id": "652xyz...",
        "make": "Toyota",
        "model": "Camry",
        "type": "Car",
        "location": "Downtown",
        "pricePerDay": 42,
        "rating": 4.8,
        "completedBookings": 156,
        "status": "active",
        "photos": ["url1", "url2"],
        "owner": "owner_id"
      },
      "score": 0.847,
      "reasons": [
        "frequently used route/location",
        "preferred vehicle type",
        "near you",
        "high-rated owner/vehicle",
        "within preferred price range"
      ],
      "preferredSlot": "evening",
      "estimatedPricePerDay": 42
    }
    // ... more recommendations
  ]
}
```

#### Error Responses

```json
// Missing userId
{
  "message": "userId required as query param or path param"
}

// User not found
{
  "message": "User not found"
}
```

---

## Features & Capabilities

### 🎯 Personalization Features

1. **Historical Pattern Recognition**
   - Analyzes up to 200 recent bookings
   - Identifies booking frequency patterns
   - Detects location preferences
   - Understands time-of-day preferences

2. **Smart Filtering**
   - Automatically excludes currently booked vehicles
   - Avoids suggesting recently used vehicles
   - Focuses on active, available vehicles only

3. **Multi-Factor Scoring**
   - Balances multiple factors for optimal suggestions
   - Considers both user preferences and vehicle quality
   - Weights factors based on importance

4. **Transparent Recommendations**
   - Provides clear reasons for each suggestion
   - Shows estimated pricing
   - Indicates preferred booking time slot

### 📊 Recommendation Reasons

The system provides clear explanations for why each vehicle is recommended:

| Reason | Trigger Condition |
|--------|------------------|
| "frequently used route/location" | Vehicle location matches top 3 preferred locations |
| "preferred vehicle type" | Vehicle type matches most-booked type |
| "near you" | Vehicle location matches user's city |
| "high-rated owner/vehicle" | Rating ≥ 4.0 |
| "within preferred price range" | Price within 60%-140% of avg historical price |

---

## Implementation Details

### File Structure

```
backend/
├── services/
│   └── recommendationService.js    # Core recommendation algorithm
├── controllers/
│   └── recommendationController.js  # HTTP request handler
└── routes/
    └── recommendation.js            # API route definitions
```

### Dependencies

- **Mongoose Models**:
  - `User.js` - User profile data
  - `Vehicle.js` - Vehicle details and availability
  - `Booking.js` - Historical booking data

### Key Functions

#### `getRecommendations(userId, opts)`

**Location**: [backend/services/recommendationService.js](backend/services/recommendationService.js)

**Parameters**:
- `userId` (String): MongoDB ObjectId of the user
- `opts` (Object): Configuration options
  - `limit` (Number): Maximum recommendations to return (default: 8)
  - `excludeRecentDays` (Number): Days to exclude recently booked vehicles (default: 7)

**Returns**: Promise resolving to recommendation results object

#### `timeSlotFromDate(date)`

Converts a date/time to a time slot category.

**Parameters**:
- `date` (Date): JavaScript Date object

**Returns**: String - One of: `'morning'`, `'afternoon'`, `'evening'`, `'late_night'`

#### `normalize(value, min, max)`

Normalizes a value to 0-1 range for scoring.

**Parameters**:
- `value` (Number): Value to normalize
- `min` (Number): Minimum bound
- `max` (Number): Maximum bound

**Returns**: Number between 0 and 1

---

## Usage Examples

### Frontend Integration

```javascript
// Using apiService
import { apiService } from '../services/apiService';

async function loadRecommendations(userId, limit = 8) {
  try {
    const response = await apiService.get(`/api/recommendations/${userId}?limit=${limit}`);
    const { recommendations, user, stats } = response.data;
    
    console.log(`Found ${recommendations.length} recommendations for user in ${user.city}`);
    console.log(`User typically spends $${stats.avgPrice} per day`);
    
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.vehicle.make} ${rec.vehicle.model}`);
      console.log(`   Score: ${rec.score}`);
      console.log(`   Reasons: ${rec.reasons.join(', ')}`);
      console.log(`   Price: $${rec.estimatedPricePerDay}/day`);
    });
    
    return recommendations;
  } catch (error) {
    console.error('Failed to load recommendations:', error);
    return [];
  }
}
```

### React Component Example

```jsx
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

function RecommendedVehicles({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const { data } = await apiService.get(`/api/recommendations/${userId}?limit=6`);
        setRecommendations(data.recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  if (loading) return <div>Loading personalized recommendations...</div>;
  if (recommendations.length === 0) return <div>No recommendations available</div>;

  return (
    <div className="recommendations">
      <h2>Recommended For You</h2>
      <div className="vehicle-grid">
        {recommendations.map((rec) => (
          <div key={rec.vehicle._id} className="vehicle-card">
            <img src={rec.vehicle.photos[0]} alt={`${rec.vehicle.make} ${rec.vehicle.model}`} />
            <h3>{rec.vehicle.make} {rec.vehicle.model}</h3>
            <p className="location">{rec.vehicle.location}</p>
            <p className="price">${rec.estimatedPricePerDay}/day</p>
            <div className="rating">⭐ {rec.vehicle.rating}</div>
            <div className="reasons">
              {rec.reasons.map((reason, idx) => (
                <span key={idx} className="badge">{reason}</span>
              ))}
            </div>
            <button>Book Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendedVehicles;
```

---

## Customization Options

### Adjusting Recommendation Count

Change the default number of recommendations:

```javascript
// Default: 8 recommendations
const result = await recommendationService.getRecommendations(userId, { limit: 12 });
```

### Modifying Exclusion Period

Change how many days to exclude recently booked vehicles:

```javascript
// Default: 7 days
const result = await recommendationService.getRecommendations(userId, { 
  limit: 8,
  excludeRecentDays: 14  // Exclude vehicles booked in last 2 weeks
});
```

### Tuning Score Weights

Modify weights in [recommendationService.js](backend/services/recommendationService.js#L107-L112):

```javascript
// Current weights
const score = (ratingScore * 0.4) +      // Rating importance
              (matchLocation * 0.2) +     // Location matching
              (matchType * 0.15) +        // Type matching
              (priceNorm * 0.15) +        // Price optimization
              (completedNorm * 0.1) +     // Booking history
              (cityBonus * 0.1);          // City proximity
```

### Adjusting Price Range Tolerance

Modify price range calculations in [recommendationService.js](backend/services/recommendationService.js#L63-L66):

```javascript
// Current: 60% to 140% of average
minPrice = Math.max(0, avgPrice * 0.6);   // Lower bound
maxPrice = avgPrice * 1.4;                 // Upper bound

// Example: Tighter range (80% to 120%)
minPrice = Math.max(0, avgPrice * 0.8);
maxPrice = avgPrice * 1.2;
```

### Changing Time Slot Boundaries

Modify time slot definitions in [recommendationService.js](backend/services/recommendationService.js#L6-L11):

```javascript
function timeSlotFromDate(d) {
  const h = d.getHours();
  if (h >= 5 && h < 11) return 'morning';      // 5 AM - 11 AM
  if (h >= 11 && h < 17) return 'afternoon';   // 11 AM - 5 PM
  if (h >= 17 && h < 22) return 'evening';     // 5 PM - 10 PM
  return 'late_night';                         // 10 PM - 5 AM
}
```

---

## Best Practices

### For Backend Developers

1. **Performance Optimization**
   - Monitor query performance as booking data grows
   - Consider adding database indexes on frequently queried fields
   - Implement caching for frequently requested recommendations

2. **Data Quality**
   - Ensure vehicle status is kept up-to-date
   - Validate booking data completeness
   - Handle edge cases (new users with no history)

3. **Testing**
   - Test with users having varied booking histories
   - Verify recommendations for edge cases (no bookings, single booking, etc.)
   - Validate score calculations with different data patterns

### For Frontend Developers

1. **User Experience**
   - Display loading states while fetching recommendations
   - Show reason badges to explain suggestions
   - Implement fallback UI for users without recommendations

2. **Performance**
   - Cache recommendations with appropriate TTL
   - Implement pagination for large result sets
   - Use skeleton loaders during data fetch

3. **Error Handling**
   - Gracefully handle API failures
   - Provide alternative content when recommendations fail
   - Log errors for debugging

---

## Future Enhancements

Potential improvements to the recommendation system:

1. **Machine Learning Integration**
   - Implement collaborative filtering
   - Use neural networks for pattern recognition
   - Add similarity scoring between users

2. **Advanced Features**
   - Real-time availability checking
   - Seasonal trend analysis
   - Weather-based recommendations
   - Event-based suggestions (holidays, festivals)

3. **Personalization Improvements**
   - User feedback loop (likes/dislikes)
   - Explicit preference settings
   - Search history integration
   - Social recommendations (friends' bookings)

4. **Performance Optimizations**
   - Redis caching layer
   - Pre-computed recommendations
   - Incremental updates instead of full recalculation

---

## Troubleshooting

### No Recommendations Returned

**Possible Causes**:
- User has no booking history
- No active vehicles match user preferences
- All matching vehicles are currently booked

**Solutions**:
- Implement fallback logic to show popular vehicles
- Broaden search criteria when no matches found
- Display recently added vehicles as alternatives

### Low-Quality Recommendations

**Possible Causes**:
- Insufficient booking history (< 5 bookings)
- User booking patterns are too diverse
- Vehicle data quality issues

**Solutions**:
- Adjust scoring weights for users with limited history
- Implement hybrid recommendation (content + collaborative)
- Clean up vehicle data and ensure completeness

### Performance Issues

**Possible Causes**:
- Large number of bookings to analyze
- Inefficient database queries
- No indexes on query fields

**Solutions**:
- Limit historical analysis to recent 200 bookings
- Add indexes: `Booking(user, status, bookingTime)`, `Vehicle(status, type, location)`
- Implement result caching with 5-15 minute TTL

---

## Related Documentation

- [API Endpoints Reference](api/API_ENDPOINTS_REFERENCE.md)
- [Booking System Documentation](BOOKING_AND_PAYMENT_SYSTEM.md)
- [Vehicle Management System](VEHICLE_MANAGEMENT_SYSTEM.md)
- [Technology Deep Dive](tech-stack/TECHNOLOGY_DEEP_DIVE.md)

---

## Support

For questions or issues related to the recommendation system:

1. Check the [API Documentation](api/API_ENDPOINTS_REFERENCE.md)
2. Review the source code in [backend/services/recommendationService.js](backend/services/recommendationService.js)
3. Contact the development team

---

**Last Updated**: February 1, 2026  
**Version**: 1.0  
**Maintainer**: RideShareX Development Team
