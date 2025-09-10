# Multiple Events API Setup Guide

This guide helps you set up multiple event APIs to populate your Lo app with diverse events from various sources.

## 🎫 Current Event Sources

### ✅ Working APIs:
1. **Ticketmaster** - Concerts, sports, theater
2. **SeatGeek** - Secondary market tickets, concerts, sports  
3. **PredictHQ** - Comprehensive events intelligence
4. **Yelp Events** - Local events, nightlife, dining events

### ❌ Deprecated:
- **Eventbrite** - Their public search API no longer exists

## 📝 API Setup Instructions

### 1. SeatGeek (Free Tier Available)
**What it provides:** Sports, concerts, theater, comedy shows

1. Sign up at: https://seatgeek.com/account/develop
2. Get your Client ID (free tier includes 1000 requests/month)
3. Set in Supabase:
   ```bash
   supabase secrets set SEATGEEK_CLIENT_ID=your_client_id_here
   ```

### 2. PredictHQ (Free Tier Available) 
**What it provides:** Festivals, concerts, sports, conferences, community events

1. Sign up at: https://www.predicthq.com/signup
2. Choose free plan (500 API calls/month)
3. Get your Access Token from dashboard
4. Set in Supabase:
   ```bash
   supabase secrets set PREDICTHQ_API_TOKEN=your_token_here
   ```

### 3. Yelp Events (Free)
**What it provides:** Local events, restaurant events, nightlife, community gatherings

1. Create app at: https://www.yelp.com/developers
2. Get your API Key from app dashboard
3. Set in Supabase:
   ```bash
   supabase secrets set YELP_API_KEY=your_api_key_here
   ```

### 4. Ticketmaster (Already Set Up)
**What it provides:** Major concerts, sports, theater

Already configured with your existing key.

## 🚀 Deployment Steps

### 1. Set All API Keys
```bash
# Set all your API keys at once
supabase secrets set SEATGEEK_CLIENT_ID=your_seatgeek_id
supabase secrets set PREDICTHQ_API_TOKEN=your_predicthq_token  
supabase secrets set YELP_API_KEY=your_yelp_key

# Verify they're set
supabase secrets list
```

### 2. Deploy the Updated Function
```bash
supabase functions deploy fetch-events-realtime
```

### 3. Update Frontend to Use All Sources
The frontend needs to be updated to request events from all sources:

```javascript
// In EventsToggle.tsx, update the source array:
source: ['ticketmaster', 'seatgeek', 'predicthq', 'yelp']
```

## 🎯 Testing Each API

### Test Individual APIs:
```bash
# Test SeatGeek only
supabase functions invoke fetch-events-realtime \
  --body '{"source":["seatgeek"],"center":{"lat":34.0522,"lng":-118.2437},"radius":25,"timeframe":"24h"}'

# Test PredictHQ only  
supabase functions invoke fetch-events-realtime \
  --body '{"source":["predicthq"],"center":{"lat":34.0522,"lng":-118.2437},"radius":25,"timeframe":"24h"}'

# Test Yelp only
supabase functions invoke fetch-events-realtime \
  --body '{"source":["yelp"],"center":{"lat":34.0522,"lng":-118.2437},"radius":25,"timeframe":"24h"}'

# Test all sources
supabase functions invoke fetch-events-realtime \
  --body '{"source":["ticketmaster","seatgeek","predicthq","yelp"],"center":{"lat":34.0522,"lng":-118.2437},"radius":25,"timeframe":"24h"}'
```

## 📊 Event Source Characteristics

| API | Best For | Coverage | Free Tier |
|-----|----------|----------|-----------|
| **Ticketmaster** | Major venues, concerts | National | 5000/day |
| **SeatGeek** | Sports, resale tickets | National | 1000/month |
| **PredictHQ** | All event types | Global | 500/month |
| **Yelp** | Local/community | Local focus | 5000/day |

## 🔍 Duplicate Event Prevention

Events from different sources might overlap. The app will later implement deduplication based on:
- Event title similarity
- Same venue + same time
- Geographic proximity + time overlap

## 🎨 Event Source Icons

Each source gets its own emoji identifier:
- 🎫 Ticketmaster
- 🎟️ SeatGeek  
- 📊 PredictHQ
- 🍴 Yelp Events

## 📈 Expected Results

With all 4 APIs active, you should see:
- **Major Events**: From Ticketmaster and SeatGeek
- **Local Events**: From Yelp
- **Comprehensive Coverage**: From PredictHQ
- **Total Events**: 50-200+ per city (depending on city size)

## 🚨 Troubleshooting

### If an API isn't working:
1. Check the secret is set: `supabase secrets list`
2. Test the API individually (see test commands above)
3. Check function logs: `supabase functions logs fetch-events-realtime`

### Rate Limits:
- APIs have monthly/daily limits
- The function implements caching to reduce API calls
- Consider rotating which APIs are active if limits are reached

## 🔄 Next Steps

1. Get API keys for the services you want
2. Set them in Supabase secrets
3. Deploy the function
4. Update the frontend to request all sources
5. Test in your app!

The more APIs you activate, the more comprehensive your event coverage will be!