# Multi-Database Architecture Analysis

## Overview

This document analyzes the feasibility of supporting **database-per-city** or **database-per-region** configurations to address data sovereignty concerns.

---

## 🎯 The Problem

**Current plan**: Single shared Supabase database with RLS policies
- All cities' data in one database
- RLS policies ensure data isolation
- **Concern**: Cities don't control their data infrastructure

**City concerns**:
1. **Data sovereignty** - "Our data must stay in our country"
2. **Control** - "We want full database access for our own analytics"
3. **Compliance** - "GDPR requires data in EU datacenters"
4. **Trust** - "We don't want to share infrastructure with other cities"
5. **Exit strategy** - "What if we want to self-host later?"

---

## 🏗️ Architecture Options

### **Option 1: Single Shared Database (Current Plan)**

```
┌─────────────────────────────────────┐
│   Single Supabase Project           │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  PostgreSQL Database           │ │
│  │                                │ │
│  │  ├─ Amsterdam data (RLS)      │ │
│  │  ├─ Paris data (RLS)          │ │
│  │  ├─ Berlin data (RLS)         │ │
│  │  └─ Tokyo data (RLS)          │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Pros**:
- ✅ Simplest to implement
- ✅ Lowest cost (one Supabase project)
- ✅ Easy user management across cities
- ✅ Platform-wide analytics easy
- ✅ Centralized backups

**Cons**:
- ❌ All data in one place
- ❌ No data sovereignty
- ❌ Cities can't self-host
- ❌ Single point of failure
- ❌ One datacenter location

---

### **Option 2: Database-Per-City (Full Isolation)**

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Supabase EU-1    │  │ Supabase US-1    │  │ Supabase Asia-1  │
│                  │  │                  │  │                  │
│ Amsterdam DB     │  │ Toronto DB       │  │ Tokyo DB         │
│ Paris DB         │  │ NYC DB           │  │ Seoul DB         │
│ Berlin DB        │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Pros**:
- ✅ Full data sovereignty per city
- ✅ Geographic data residency
- ✅ Each city can self-host or export
- ✅ Failure isolation (one city down doesn't affect others)
- ✅ Independent scaling per city

**Cons**:
- ❌ Complex to manage (N databases)
- ❌ Higher costs (N Supabase projects)
- ❌ User management nightmare (cross-city users)
- ❌ Platform analytics requires federation
- ❌ Schema migrations need N deployments

---

### **Option 3: Database-Per-Region (Grouped Isolation)**

```
┌────────────────────────────┐  ┌────────────────────────────┐
│ Supabase Europe            │  │ Supabase North America     │
│                            │  │                            │
│  ├─ Amsterdam              │  │  ├─ Toronto                │
│  ├─ Paris                  │  │  ├─ NYC                    │
│  ├─ Berlin                 │  │  └─ SF                     │
│  └─ London                 │  │                            │
└────────────────────────────┘  └────────────────────────────┘
```

**Pros**:
- ✅ Better data sovereignty than Option 1
- ✅ Regional compliance (GDPR in EU)
- ✅ Fewer databases than Option 2
- ✅ Regional performance optimization

**Cons**:
- ❌ Still complex (3-5 databases)
- ❌ Cities in same region share DB
- ❌ User management still complex
- ❌ Not as flexible as Option 2

---

### **Option 4: Hybrid (Smart Routing)**

```
┌─────────────────────────────────────┐
│   Platform Configuration            │
│                                      │
│   City Database Assignments:        │
│   ├─ Amsterdam → EU Shared DB       │
│   ├─ Paris → EU Shared DB           │
│   ├─ Tokyo → Dedicated DB (paid)    │
│   ├─ NYC → Dedicated DB (paid)      │
│   └─ Berlin → Self-hosted           │
└─────────────────────────────────────┘
```

**Pros**:
- ✅ Flexible per-city choice
- ✅ Small cities share (cheaper)
- ✅ Large cities get dedicated (sovereignty)
- ✅ Self-hosting possible
- ✅ Future-proof

**Cons**:
- ❌ Most complex to implement
- ❌ Multiple code paths
- ❌ Testing complexity

---

## 💻 Implementation Complexity

### **Complexity Rating**

| Aspect | Shared DB | Per-Region | Per-City | Hybrid |
|--------|-----------|------------|----------|--------|
| **Initial Setup** | 🟢 Low | 🟡 Medium | 🔴 High | 🔴 Very High |
| **User Management** | 🟢 Easy | 🟡 Complex | 🔴 Very Complex | 🔴 Very Complex |
| **Schema Migrations** | 🟢 Single | 🟡 Multiple | 🔴 Many | 🔴 Many + Logic |
| **Monitoring** | 🟢 Simple | 🟡 Medium | 🔴 Complex | 🔴 Complex |
| **Costs** | 🟢 Lowest | 🟡 Medium | 🔴 Highest | 🟡 Variable |
| **Data Sovereignty** | 🔴 None | 🟡 Regional | 🟢 Full | 🟢 Full |

---

## 🔧 Technical Implementation

### **Multi-Database Connection Management**

```typescript
// lib/supabase/router.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Database configuration per city
const cityDatabaseConfig = {
  amsterdam: {
    url: process.env.SUPABASE_EU_URL,
    key: process.env.SUPABASE_EU_ANON_KEY,
    region: 'eu-west-1',
  },
  paris: {
    url: process.env.SUPABASE_EU_URL,
    key: process.env.SUPABASE_EU_ANON_KEY,
    region: 'eu-west-1',
  },
  tokyo: {
    url: process.env.SUPABASE_ASIA_URL,
    key: process.env.SUPABASE_ASIA_ANON_KEY,
    region: 'ap-northeast-1',
  },
  nyc: {
    url: process.env.SUPABASE_US_URL,
    key: process.env.SUPABASE_US_ANON_KEY,
    region: 'us-east-1',
  },
}

// Get database client for a specific city
export function getCitySupabaseClient(citySlug: string) {
  const config = cityDatabaseConfig[citySlug]

  if (!config) {
    throw new Error(`No database configuration for city: ${citySlug}`)
  }

  return createSupabaseClient(config.url, config.key)
}

// Server component usage
export async function getCityData(citySlug: string) {
  const supabase = getCitySupabaseClient(citySlug)

  const { data } = await supabase
    .from('languages')
    .select('*')
    // No city_id filter needed - entire DB is for this city!

  return data
}
```

### **Multi-Database User Authentication**

**Challenge**: Users working across cities need federated auth

**Solution**: Central auth service + database routing

```typescript
// lib/auth/federation.ts

// Central user table (in platform database)
CREATE TABLE platform_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL, -- 'superuser', 'admin', 'operator'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// User-to-database mapping
CREATE TABLE user_database_access (
  user_id UUID REFERENCES platform_users(id),
  database_id TEXT NOT NULL, -- 'supabase-eu', 'supabase-asia', etc.
  city_slugs TEXT[] NOT NULL, -- Cities in this database user can access
  role TEXT NOT NULL,
  PRIMARY KEY (user_id, database_id)
);

// Auth flow
async function authenticateUser(email: string) {
  // 1. Authenticate against central platform database
  const { user } = await platformSupabase.auth.signInWithOtp({ email })

  // 2. Fetch user's database access
  const { data: access } = await platformSupabase
    .from('user_database_access')
    .select('*')
    .eq('user_id', user.id)

  // 3. Generate tokens for each database user has access to
  const tokens = await Promise.all(
    access.map(async (db) => {
      const supabase = getDatabaseClient(db.database_id)
      const { session } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email,
      })
      return { database: db.database_id, token: session.access_token }
    })
  )

  // 4. Store tokens in session
  return { user, tokens }
}
```

### **Schema Migration Management**

```typescript
// scripts/migrate-all-databases.ts

const databases = [
  { id: 'eu', url: process.env.SUPABASE_EU_URL },
  { id: 'us', url: process.env.SUPABASE_US_URL },
  { id: 'asia', url: process.env.SUPABASE_ASIA_URL },
]

async function migrateAllDatabases() {
  const migrationFile = './migrations/0001_add_ai_translation.sql'

  for (const db of databases) {
    console.log(`Migrating ${db.id}...`)

    try {
      const supabase = createClient(db.url, process.env.SERVICE_ROLE_KEY)
      const migration = await fs.readFile(migrationFile, 'utf8')

      await supabase.rpc('exec_sql', { sql: migration })

      console.log(`✅ ${db.id} migrated successfully`)
    } catch (error) {
      console.error(`❌ ${db.id} migration failed:`, error)
      throw error // Stop if any migration fails
    }
  }
}
```

---

## 📊 Cost Analysis

### **Single Shared Database**
```
1 Supabase Pro project: $25/month
Database size: 8GB (all cities)
Total: $25/month base + usage
```

### **Database-Per-Region (3 regions)**
```
3 Supabase Pro projects: $75/month
Database sizes: 3GB + 3GB + 2GB
Total: $75/month base + usage
```

### **Database-Per-City (10 cities)**
```
10 Supabase Pro projects: $250/month
Or: 5 Free tier + 5 Pro = $125/month
Total: $125-250/month base + usage
```

### **Hybrid (Small cities share, large cities dedicated)**
```
1 Shared DB (5 small cities): $25/month
3 Dedicated DBs (Tokyo, NYC, London): $75/month
Total: $100/month base + usage
```

---

## ⚖️ Recommendation

### **For MVP (Phase 1-8): Option 1 (Shared DB)** ✅

**Why**:
- Get to market faster (12-14 weeks vs 16-20 weeks)
- Prove the concept with Amsterdam
- Lower costs during validation phase
- Simpler to debug and iterate

**But design for future migration**:
- Abstract database access behind functions
- Use connection factory pattern
- Don't hard-code city_id filters everywhere

### **For Scale (Post-MVP): Option 3 (Per-Region) or Option 4 (Hybrid)** ✅

**Why**:
- Addresses data sovereignty concerns
- Meets compliance requirements (GDPR)
- Allows large cities to get dedicated infrastructure
- Provides exit strategy (city can export and self-host)

---

## 🚀 Migration Path

### **Phase 1-8 (MVP)**: Shared Database
```typescript
// Simple client creation
const supabase = createClient()
```

### **Phase 9 (Post-MVP)**: Add Database Router
```typescript
// Add router layer (no app code changes)
const supabase = getCitySupabaseClient(citySlug)
```

### **Phase 10**: Migrate Cities to Dedicated Databases
```bash
# 1. Set up new Supabase project for Tokyo
# 2. Run schema migration on new project
# 3. Export Tokyo data from shared DB
# 4. Import to dedicated Tokyo DB
# 5. Update cityDatabaseConfig
# 6. Switch traffic to new DB
# 7. Monitor for 24h
# 8. Delete Tokyo data from shared DB
```

---

## 🔐 Security Considerations

### **Shared Database (RLS)**
- RLS policies prevent cross-city access
- **Risk**: Policy bug could leak data
- **Mitigation**: Extensive RLS testing

### **Separate Databases**
- Physical isolation (no policy bugs possible)
- **Risk**: More attack surface (N databases)
- **Mitigation**: Centralized monitoring

---

## 💡 Code Architecture Pattern

**Abstraction Layer** (works for both shared and separate DBs):

```typescript
// lib/database/client.ts

// Interface all app code uses
export interface DatabaseClient {
  from(table: string): QueryBuilder
  auth: AuthClient
}

// Factory pattern
export function getDatabaseClient(context: {
  citySlug?: string
  userId?: string
}): DatabaseClient {
  // Development: Single shared DB
  if (process.env.NODE_ENV === 'development') {
    return createSharedDatabaseClient()
  }

  // Production: Route to correct database
  if (context.citySlug) {
    return getCityDatabaseClient(context.citySlug)
  }

  throw new Error('Cannot determine database')
}

// App code (unchanged regardless of architecture)
export async function getLanguages(citySlug: string) {
  const db = getDatabaseClient({ citySlug })

  return db.from('languages').select('*')
  // Works with both shared DB (+ city_id filter added internally)
  // And separate DB (no filter needed)
}
```

---

## 📋 Decision Matrix

**Choose Shared Database if**:
- ✅ You're starting with <5 cities
- ✅ Cities are okay with shared infrastructure
- ✅ Budget is limited
- ✅ You need to launch quickly

**Choose Separate Databases if**:
- ✅ Data sovereignty is critical
- ✅ Cities demand it contractually
- ✅ You have 10+ cities
- ✅ Budget allows for complexity

**Choose Hybrid if**:
- ✅ Mix of small and large cities
- ✅ Some cities pay, others don't
- ✅ Want maximum flexibility
- ✅ Have engineering resources

---

## 🎯 Complexity Assessment

### **Answer to your question: "Is it very complex?"**

**Short answer**: Moderately complex, but definitely achievable.

**Complexity breakdown**:

1. **Database routing logic**: 🟡 Medium (2-3 days)
   - City-to-database mapping
   - Connection factory pattern
   - Environment variable management

2. **User authentication**: 🔴 High (5-7 days)
   - Central auth service
   - Federated database access
   - Token management across DBs

3. **Schema migrations**: 🟡 Medium (1-2 days per migration)
   - Migration scripts for N databases
   - Rollback procedures
   - Monitoring

4. **Monitoring/Observability**: 🔴 High (3-5 days)
   - Centralized logging across DBs
   - Performance monitoring
   - Error aggregation

5. **Cost management**: 🟢 Low (1 day)
   - Tracking usage per database
   - Billing per city

**Total added complexity**: +2-3 weeks to MVP timeline

**Timeline impact**:
- MVP with shared DB: 12-14 weeks
- MVP with separate DBs: 15-17 weeks
- Adding multi-DB post-MVP: 3-4 weeks

---

## 🎬 Recommendation: Two-Phase Approach

### **Phase 1 (MVP)**: Shared Database
- Launch with Amsterdam, Paris, Berlin in shared DB
- Abstract database access behind factory pattern
- Design schema without hard-coded assumptions

### **Phase 2 (Scale)**: Add Multi-Database Support
- Implement database router
- Migrate large cities to dedicated DBs
- Offer tiered pricing:
  - **Free/Basic**: Shared database
  - **Pro**: Regional database
  - **Enterprise**: Dedicated database

This gives you:
- ✅ Fast MVP launch (12-14 weeks)
- ✅ Proven concept before complexity
- ✅ Future-proof architecture
- ✅ Migration path for cities with sovereignty concerns
- ✅ Revenue opportunity (charge for dedicated DBs)

---

**Bottom Line**: Start simple (shared DB), design for flexibility, add multi-database support when cities demand it. The architecture CAN support it without rewriting everything.
