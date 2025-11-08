# Lo - Key Performance Indicators (KPI) Dashboard
*KARMA-PM Agent - Product Analytics Framework*

**Last Updated:** October 4, 2025  
**Measurement Period:** Weekly  
**Review Cadence:** Weekly team review, monthly executive review  

---

## 📊 EXECUTIVE SUMMARY

### North Star Metric: Weekly Active Location-Based Posts (WALP)

> **Definition:** Total number of location-tagged posts created by weekly active users

**Current Target:** 2.5 posts per weekly active user  
**Formula:** `Total Posts / Weekly Active Users`

**Why This Metric?**
- Captures core product value: location-based content creation
- Drives network effects: more posts = more value for all users
- Leading indicator of engagement and retention
- Directly correlates with business outcomes (ad revenue, premium subscriptions)

---

## 📈 PRIMARY METRICS DASHBOARD

### 1. ACQUISITION METRICS

#### New User Signups
**Target:** 10,000/month  
**Current:** [TBD - Not yet launched]  
**Measurement:** Registration completions  

**Breakdown:**
- Email/Password: [TBD]
- Google OAuth: [TBD]
- Apple Sign-In: [TBD]

**Tracking:**
```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as signups,
  COUNT(*) FILTER (WHERE metadata->>'auth_method' = 'email') as email_signups,
  COUNT(*) FILTER (WHERE metadata->>'auth_method' = 'google') as google_signups,
  COUNT(*) FILTER (WHERE metadata->>'auth_method' = 'apple') as apple_signups
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date;
```

---

#### Acquisition Source Mix
**Target:** 60% Organic / 40% Paid  
**Current:** [TBD]  
**Measurement:** UTM parameters + attribution tracking  

**Channels:**
- Organic (ASO, PR, Word-of-Mouth): [TBD]
- Paid Social (Instagram, TikTok): [TBD]
- Influencer Marketing: [TBD]
- Campus Ambassadors: [TBD]
- Event Activations: [TBD]

**Tracking:**
```sql
SELECT 
  metadata->>'utm_source' as source,
  COUNT(*) as signups,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY signups DESC;
```

---

#### Activation Rate
**Target:** 40% (users who post within 7 days)  
**Current:** [TBD]  
**Formula:** `(Users Who Posted in 7 Days / Total Signups) * 100`

**Cohort Analysis:**
| Signup Date | Total Users | Posted Within 7 Days | Activation Rate |
|-------------|-------------|----------------------|-----------------|
| Week 1      | [TBD]       | [TBD]                | [TBD]%          |
| Week 2      | [TBD]       | [TBD]                | [TBD]%          |
| Week 3      | [TBD]       | [TBD]                | [TBD]%          |

**Tracking:**
```sql
WITH new_users AS (
  SELECT id, created_at
  FROM auth.users
  WHERE created_at >= NOW() - INTERVAL '30 days'
),
posted_users AS (
  SELECT DISTINCT user_id
  FROM messages
  WHERE created_at <= (SELECT created_at + INTERVAL '7 days' FROM new_users WHERE id = user_id)
)
SELECT 
  COUNT(DISTINCT new_users.id) as total_signups,
  COUNT(DISTINCT posted_users.user_id) as activated_users,
  ROUND(COUNT(DISTINCT posted_users.user_id)::numeric / COUNT(DISTINCT new_users.id) * 100, 2) as activation_rate
FROM new_users
LEFT JOIN posted_users ON new_users.id = posted_users.user_id;
```

---

#### App Store Rating
**Target:** 4.5+ stars  
**Current:** [TBD - Not yet launched]  
**Measurement:** iOS App Store rating  

**Review Sentiment Analysis:**
- 5-star reviews: [TBD]
- 4-star reviews: [TBD]
- 3-star reviews: [TBD]
- 2-star reviews: [TBD]
- 1-star reviews: [TBD]

**Action Items:**
- If rating drops below 4.0: Emergency response team review
- Monitor keywords in reviews for feature requests and bugs
- Respond to negative reviews within 24 hours

---

### 2. ENGAGEMENT METRICS

#### Daily Active Users (DAU)
**Target:** 3,000  
**Current:** [TBD]  
**Measurement:** Unique users with at least one session per day  

**7-Day Trend:**
| Date | DAU | Change |
|------|-----|--------|
| Mon  | [TBD] | - |
| Tue  | [TBD] | [TBD]% |
| Wed  | [TBD] | [TBD]% |
| Thu  | [TBD] | [TBD]% |
| Fri  | [TBD] | [TBD]% |
| Sat  | [TBD] | [TBD]% |
| Sun  | [TBD] | [TBD]% |

**Tracking:**
```sql
SELECT 
  DATE_TRUNC('day', last_sign_in_at) as date,
  COUNT(DISTINCT id) as dau
FROM auth.users
WHERE last_sign_in_at >= NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date;
```

---

#### Weekly Active Users (WAU)
**Target:** 8,000  
**Current:** [TBD]  
**Measurement:** Unique users with at least one session per week  

**4-Week Trend:**
| Week | WAU | Growth |
|------|-----|--------|
| W-3  | [TBD] | - |
| W-2  | [TBD] | [TBD]% |
| W-1  | [TBD] | [TBD]% |
| Current | [TBD] | [TBD]% |

---

#### DAU/WAU Ratio (Stickiness)
**Target:** 38%  
**Current:** [TBD]  
**Formula:** `(DAU / WAU) * 100`

**Benchmark:**
- 20% - Poor stickiness
- 20-40% - Good stickiness ✅ Target
- 40%+ - Excellent stickiness

**Interpretation:**
- Higher ratio = users coming back more frequently
- Lower ratio = users engage sporadically

---

#### Session Duration
**Target:** 8 minutes average  
**Current:** [TBD]  
**Measurement:** Time from app open to close  

**Distribution:**
| Duration | % of Sessions |
|----------|---------------|
| <1 min   | [TBD]%        |
| 1-3 min  | [TBD]%        |
| 3-5 min  | [TBD]%        |
| 5-10 min | [TBD]%        |
| 10+ min  | [TBD]%        |

**Tracking:**
- Tool: Custom analytics + Supabase logs
- Alert: If average drops below 5 minutes

---

#### Posts per Weekly Active User (North Star Metric)
**Target:** 2.5 posts/week  
**Current:** [TBD]  
**Formula:** `Total Posts / Weekly Active Users`

**Cohort Breakdown:**
| User Tenure | Posts/Week | Target | Status |
|-------------|------------|--------|--------|
| New (<7 days) | [TBD] | 1.5 | [TBD] |
| Established (7-30 days) | [TBD] | 2.5 | [TBD] |
| Power Users (30+ days) | [TBD] | 4.0 | [TBD] |

**Tracking:**
```sql
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as total_posts,
  COUNT(DISTINCT user_id) as active_posters,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT user_id), 2) as posts_per_user
FROM messages
WHERE created_at >= NOW() - INTERVAL '8 weeks'
  AND user_id IS NOT NULL
GROUP BY week
ORDER BY week;
```

---

#### Map Interactions per Session
**Target:** 15 interactions  
**Current:** [TBD]  
**Measurement:** Pins clicked + map pans + zooms  

**Interaction Types:**
- Pin clicks: [TBD]
- Map pans: [TBD]
- Map zooms: [TBD]
- Search queries: [TBD]
- Filter changes: [TBD]

**Tracking:**
- Event: `map_interaction`
- Properties: `type`, `session_id`, `timestamp`

---

### 3. RETENTION METRICS

#### Day 1 Retention
**Target:** 40%  
**Current:** [TBD]  
**Formula:** `(Users who returned Day 1 / Total signups) * 100`

**Cohort Table:**
| Signup Week | Total Users | Day 1 Retention |
|-------------|-------------|-----------------|
| Week 1      | [TBD]       | [TBD]%          |
| Week 2      | [TBD]       | [TBD]%          |
| Week 3      | [TBD]       | [TBD]%          |
| Week 4      | [TBD]       | [TBD]%          |

**Tracking:**
```sql
WITH signups AS (
  SELECT id, DATE(created_at) as signup_date
  FROM auth.users
  WHERE created_at >= NOW() - INTERVAL '30 days'
),
day1_returns AS (
  SELECT DISTINCT user_id
  FROM auth.users
  WHERE DATE(last_sign_in_at) = (SELECT signup_date + INTERVAL '1 day' FROM signups WHERE id = user_id)
)
SELECT 
  COUNT(DISTINCT signups.id) as total_signups,
  COUNT(DISTINCT day1_returns.user_id) as day1_returns,
  ROUND(COUNT(DISTINCT day1_returns.user_id)::numeric / COUNT(DISTINCT signups.id) * 100, 2) as day1_retention
FROM signups
LEFT JOIN day1_returns ON signups.id = day1_returns.user_id;
```

---

#### Day 7 Retention
**Target:** 25%  
**Current:** [TBD]  

#### Day 30 Retention
**Target:** 15%  
**Current:** [TBD]  

**Retention Curve:**
```
Day 0:  100% ────────────────────────────────
Day 1:   40% ────────────────────
Day 3:   32% ──────────────
Day 7:   25% ────────────
Day 14:  20% ──────────
Day 30:  15% ────────
Day 60:  12% ──────
Day 90:  10% ─────
```

---

#### Monthly Churn Rate
**Target:** <10%  
**Current:** [TBD]  
**Formula:** `(Users Lost in Month / Users at Start of Month) * 100`

**Churn Reasons (from exit surveys):**
- [TBD] Not enough content in my area
- [TBD] Privacy concerns
- [TBD] App performance issues
- [TBD] Lack of friends using app
- [TBD] Other

**Action Items:**
- If churn >15%: Deep dive into user feedback
- Implement win-back campaigns for churned users

---

### 4. CONTENT METRICS

#### Total Posts Created
**Target:** 25,000/month  
**Current:** [TBD]  

**Post Types:**
| Type | Count | % of Total |
|------|-------|------------|
| Text only | [TBD] | [TBD]% |
| Text + Photo | [TBD] | [TBD]% |
| Text + Video | [TBD] | [TBD]% |
| Live Stream | [TBD] | [TBD]% |
| Event | [TBD] | [TBD]% |

---

#### Media Attachment Rate
**Target:** 60% of posts have photo/video  
**Current:** [TBD]  
**Formula:** `(Posts with Media / Total Posts) * 100`

**Tracking:**
```sql
SELECT 
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE media_url IS NOT NULL) as posts_with_media,
  ROUND(COUNT(*) FILTER (WHERE media_url IS NOT NULL)::numeric / COUNT(*) * 100, 2) as media_rate
FROM messages
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND message_type = 'user';
```

---

#### Event Interactions
**Target:** 1,000/day  
**Current:** [TBD]  
**Measurement:** Event pins clicked + details viewed  

**Top Event Sources:**
| Source | Interactions | Conversion to Ticket |
|--------|--------------|----------------------|
| Ticketmaster | [TBD] | [TBD]% |
| Eventbrite | [TBD] | [TBD]% |

**Tracking:**
- Event: `event_view`
- Event: `event_click_tickets`
- Conversion tracking via referral URLs

---

#### Live Streams Created
**Target:** 100/week  
**Current:** [TBD]  

**Stream Metrics:**
| Metric | Average |
|--------|---------|
| Stream Duration | [TBD] min |
| Viewers per Stream | [TBD] |
| Comments per Stream | [TBD] |
| Peak Concurrent Viewers | [TBD] |

---

#### Comments per Post
**Target:** 2.5 average  
**Current:** [TBD]  
**Formula:** `Total Comments / Total Posts`

**Engagement Depth:**
- Posts with 0 comments: [TBD]%
- Posts with 1-2 comments: [TBD]%
- Posts with 3-5 comments: [TBD]%
- Posts with 6+ comments: [TBD]%

**Tracking:**
```sql
SELECT 
  DATE_TRUNC('week', messages.created_at) as week,
  COUNT(DISTINCT messages.id) as total_posts,
  COUNT(comments.id) as total_comments,
  ROUND(COUNT(comments.id)::numeric / COUNT(DISTINCT messages.id), 2) as comments_per_post
FROM messages
LEFT JOIN comments ON messages.id = comments.message_id
WHERE messages.created_at >= NOW() - INTERVAL '8 weeks'
GROUP BY week
ORDER BY week;
```

---

### 5. TECHNICAL PERFORMANCE METRICS

#### Map Load Time
**Target:** ≤2 seconds (p95)  
**Current:** ⚠️ 5+ seconds (NEEDS FIX)  
**Measurement:** Time from app open to map interactive  

**Latency Distribution:**
| Percentile | Target | Current | Status |
|------------|--------|---------|--------|
| p50 | ≤1s | [TBD] | [TBD] |
| p75 | ≤1.5s | [TBD] | [TBD] |
| p95 | ≤2s | [TBD] | ❌ |
| p99 | ≤3s | [TBD] | ❌ |

**Alert:** If p95 > 3 seconds for 3+ consecutive hours

---

#### App Crash Rate
**Target:** <0.5%  
**Current:** [TBD - Not yet tracked]  
**Formula:** `(Sessions with Crash / Total Sessions) * 100`

**Crash Types:**
- Memory crashes: [TBD]
- Network errors: [TBD]
- Map rendering errors: [TBD]
- Media upload errors: [TBD]

**Action Items:**
- Immediate fix for crashes affecting >1% of users
- Weekly crash triage meeting

---

#### API Response Time
**Target:** ≤100ms (p95)  
**Current:** ✅ ~80ms average  
**Measurement:** Supabase query latency  

**Query Performance:**
| Query Type | Target | Current | Status |
|------------|--------|---------|--------|
| Spatial queries (nearby posts) | ≤100ms | [TBD] | [TBD] |
| User profile load | ≤50ms | [TBD] | [TBD] |
| Post creation | ≤200ms | [TBD] | [TBD] |
| Comment submission | ≤100ms | [TBD] | [TBD] |

---

#### Crash-Free Sessions
**Target:** 99.5%  
**Current:** [TBD]  
**Industry Benchmark:** 99.5% for 4-star rated apps  

**Tracking:**
- Tool: Firebase Crashlytics or Sentry
- Alert: If crash-free rate drops below 99%

---

### 6. BUSINESS METRICS

#### Customer Acquisition Cost (CAC)
**Target:** ≤$5 per install  
**Current:** [TBD]  
**Formula:** `Total Marketing Spend / New Users Acquired`

**Channel Breakdown:**
| Channel | Spend | Users | CAC |
|---------|-------|-------|-----|
| Paid Social | [TBD] | [TBD] | [TBD] |
| Influencer | [TBD] | [TBD] | [TBD] |
| Campus Ambassadors | [TBD] | [TBD] | [TBD] |
| Event Activations | [TBD] | [TBD] | [TBD] |
| **Blended** | [TBD] | [TBD] | **[TBD]** |

---

#### Lifetime Value (LTV)
**Target:** $25+ over 12 months  
**Current:** [TBD]  
**Formula:** `(ARPU * Gross Margin) / Churn Rate`

**Revenue Streams:**
- Advertising revenue: [TBD]
- Premium subscriptions: [TBD]
- Event referral commissions: [TBD]
- Promoted locations: [TBD]

---

#### LTV:CAC Ratio
**Target:** 5:1  
**Current:** [TBD]  
**Benchmark:**
- <1:1 - Unsustainable
- 1:1 - 3:1 - Needs improvement
- 3:1 - 5:1 - Good ✅
- 5:1+ - Excellent

**Formula:** `LTV / CAC`

---

#### Monthly Recurring Revenue (MRR)
**Target:** $50,000 by V2.0 launch  
**Current:** [TBD]  

**Revenue Breakdown:**
- Premium subscriptions ($5/month): [TBD] * [TBD] subscribers
- Advertising revenue: [TBD]
- Event referral commissions: [TBD]

---

#### Revenue per User (ARPU)
**Target:** $0.50/month  
**Current:** [TBD]  
**Formula:** `Total Revenue / Monthly Active Users`

---

## 📉 ALERT THRESHOLDS

### Critical Alerts (Immediate Action Required)
- ❌ Map load time p95 > 5 seconds for 1+ hour
- ❌ Crash-free rate < 98%
- ❌ API error rate > 5%
- ❌ DAU drops >20% in 24 hours
- ❌ Activation rate < 25% for 7+ days

### High Priority Alerts (Review within 24 hours)
- ⚠️ Day 1 retention < 30%
- ⚠️ North Star Metric (WALP) < 2.0 for 7+ days
- ⚠️ Churn rate > 15% in a month
- ⚠️ App Store rating drops below 4.0
- ⚠️ CAC exceeds $8

### Medium Priority Alerts (Review within 1 week)
- 🔔 Session duration < 6 minutes for 14+ days
- 🔔 Media attachment rate < 50%
- 🔔 Comments per post < 2.0

---

## 🎯 GOAL TRACKING (90-Day OKRs)

### Objective 1: Achieve Product-Market Fit in Austin
**Key Results:**
- [ ] 10,000 users in Austin metro area
- [ ] 40% activation rate (post within 7 days)
- [ ] 2.5 posts per weekly active user
- [ ] 4.5+ App Store rating

**Status:** [TBD]  
**Owner:** Product Manager  
**Due Date:** End of Q1 2026  

---

### Objective 2: Build Healthy Engagement Loops
**Key Results:**
- [ ] 40% Day 1 retention
- [ ] 25% Day 7 retention
- [ ] 8-minute average session duration
- [ ] 15+ map interactions per session

**Status:** [TBD]  
**Owner:** Product Manager + Frontend Experience  
**Due Date:** End of Q1 2026  

---

### Objective 3: Optimize Technical Performance
**Key Results:**
- [ ] Map load time ≤2 seconds (p95)
- [ ] API response time ≤100ms (p95)
- [ ] 99.5% crash-free sessions
- [ ] <0.5% app crash rate

**Status:** [TBD]  
**Owner:** Infrastructure Platform + Performance Engineer  
**Due Date:** End of Q4 2025  

---

### Objective 4: Demonstrate Unit Economics
**Key Results:**
- [ ] CAC ≤$5 (blended)
- [ ] LTV ≥$25 (12-month)
- [ ] LTV:CAC ratio ≥5:1
- [ ] MRR ≥$10,000 by end of Q1 2026

**Status:** [TBD]  
**Owner:** Growth + Business Development  
**Due Date:** End of Q1 2026  

---

## 📊 DASHBOARD IMPLEMENTATION

### Tools & Stack
- **Analytics:** Custom Supabase queries + visualization
- **Real-time Monitoring:** Grafana or Datadog
- **Crash Reporting:** Firebase Crashlytics or Sentry
- **A/B Testing:** PostHog or LaunchDarkly
- **Attribution:** Adjust or AppsFlyer

### Dashboard Access
- **Founders:** Full access to all metrics
- **Product Team:** Engagement + retention metrics
- **Engineering:** Technical performance metrics
- **Marketing:** Acquisition + CAC metrics

### Review Cadence
- **Daily:** Critical metrics (DAU, crash rate, map load time)
- **Weekly:** Full dashboard review with product team
- **Monthly:** Executive review with OKR progress
- **Quarterly:** Strategic planning with updated targets

---

## ✅ KPI FRAMEWORK SELF-CRITIQUE

**Checklist:**
- ✅ **North Star Metric clearly defined?** YES - WALP captures core value
- ✅ **Metrics aligned with user and business goals?** YES - Covers acquisition, engagement, retention, revenue
- ✅ **Actionable thresholds and alerts?** YES - Clear alert levels defined
- ✅ **Tracking implementation feasible?** YES - SQL queries and tools specified
- ✅ **Review cadence established?** YES - Daily, weekly, monthly, quarterly

---

**Next Steps:**
1. Implement analytics tracking (custom events + Supabase queries)
2. Set up real-time dashboard (Grafana or equivalent)
3. Configure alert thresholds and notifications
4. Begin weekly KPI review meetings
5. Iterate on metrics based on learnings

---

*Document End - Lo KPI Dashboard v1.0*
