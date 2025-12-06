# Conference Room Booking System - Architecture Document

## System Overview

Microservices-based conference room booking system built with Node.js, TypeScript, React, and PostgreSQL, orchestrated with Docker Compose.

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────┐
│                         Client Layer                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Tailwind CSS + Zustand     │  │
│  │  - Login/Register Pages                             │  │
│  │  - Dashboard (Room Listing & Booking)               │  │
│  │  - My Bookings Management                           │  │
│  │  - Admin: Room Management                           │  │
│  │  - Admin: System Logs                               │  │
│  └─────────────────────────────────────────────────────┘  │
│                      ↓ HTTP/REST ↓                        │
└───────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────┐
│                      API Gateway Layer                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Express.js + http-proxy-middleware                 │  │
│  │  - CORS Configuration                               │  │
│  │  - Rate Limiting (100 req/15min)                    │  │
│  │  - Request Logging                                  │  │
│  │  - JWT Token Forwarding                             │  │
│  │  - Error Handling & Timeouts                        │  │
│  └─────────────────────────────────────────────────────┘  │
│       ↓ /auth/*    ↓ /rooms/*    ↓ /bookings/*  ↓ /logs/* │
└───────────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐
│   Auth     │  │   CRUD     │  │   CRUD     │  │   Logs    │
│  Service   │  │  Service   │  │  Service   │  │  Service  │
│            │  │            │  │            │  │           │
│ - Register │  │ - Rooms    │  │ - Bookings │  │ - Create  │
│ - Login    │  │   CRUD     │  │   CRUD     │  │ - Filter  │
│ - Verify   │  │ - Admin    │  │ - Conflict │  │ - Stats   │
│   Token    │  │   Only     │  │   Check    │  │           │
│ - Refresh  │  │            │  │ - Status   │  │           │
│            │  │            │  │   Update   │  │           │
└──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬────┘
       ↓                ↓                ↓                ↓
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ PostgreSQL │  │ PostgreSQL │  │ PostgreSQL │  │ PostgreSQL │
│  auth_db   │  │  crud_db   │  │  crud_db   │  │  logs_db   │
│            │  │            │  │            │  │            │
│ - users    │  │ - rooms    │  │ - bookings │  │ - logs     │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
```

## Service Communication Patterns

### 1. Client → API Gateway → Services

**Flow:**

```
Client Request
  → API Gateway (CORS, Rate Limit, JWT Forward)
    → Target Service (Auth/CRUD/Logs)
      → Database
    ← Response
  ← Gateway Response
← Client receives data
```

### 2. Inter-Service Communication

#### Token Verification (CRUD → Auth)

```
CRUD Service receives request with JWT
  → Extracts token from Authorization header
    → HTTP POST to auth-service/api/auth/verify-token
      ← Returns {valid: true, user: {...}}
    → Continues with authorized user context
  OR
    ← Returns 401 Unauthorized
```

#### Event Logging (All Services → Logs)

```
Service completes action (user.login, booking.created, etc.)
  → Fire-and-forget HTTP POST to logs-service/api/logs
    → Logs service stores event
  → Main flow continues (logging failure doesn't break app)
```

## Data Models

### Auth Service (auth_db)

```typescript
User {
  id: UUID (PK)
  email: String (unique)
  passwordHash: String (bcrypt, 12 rounds)
  role: Enum (USER | ADMIN)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### CRUD Service (crud_db)

```typescript
Room {
  id: UUID (PK)
  name: String (unique)
  capacity: Integer
  equipment: String[]
  isAvailable: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}

Booking {
  id: UUID (PK)
  roomId: UUID (FK → Room)
  userId: UUID (reference only, not FK)
  startTime: DateTime
  endTime: DateTime
  purpose: String
  status: Enum (ACTIVE | CANCELLED | COMPLETED)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Logs Service (logs_db)

```typescript
Log {
  id: UUID (PK)
  timestamp: DateTime (indexed)
  serviceName: String (indexed)
  action: String (indexed)
  userId: UUID? (indexed)
  details: JSONB
  ipAddress: String
  createdAt: DateTime
}
```

## Security Architecture

### Authentication & Authorization

1. **Password Security**: bcrypt with 12 salt rounds
2. **JWT Structure**:
   ```json
   {
   	"userId": "uuid",
   	"email": "user@example.com",
   	"role": "USER|ADMIN",
   	"iat": 1234567890,
   	"exp": 1234568790
   }
   ```
3. **Token Lifecycle**:
   - Access Token: 15 minutes (short-lived)
   - Refresh Token: 7 days (stored separately)
   - Automatic refresh on 401 (client-side)

### Authorization Levels

- **Public**: None (login, register only)
- **Authenticated**: All endpoints except admin-only
- **Admin Only**:
  - Room CRUD operations
  - View all bookings
  - Access system logs

## Deployment Architecture

### Docker Compose Services

```yaml
Networks:
  backend-network: Auth, CRUD, Logs, API Gateway, PostgreSQL instances
  frontend-network: API Gateway, Client

Volumes:
  auth-db-data: Persistent PostgreSQL data
  crud-db-data: Persistent PostgreSQL data
  logs-db-data: Persistent PostgreSQL data

Health Checks:
  - All services: HTTP GET /health
  - Databases: pg_isready command
  - Dependencies: services wait for healthy status
```

### Service Dependencies

```
Logs Service (independent)
  ↑
Auth Service (depends on logs-service, auth-db)
  ↑
CRUD Service (depends on auth-service, logs-service, crud-db)
  ↑
API Gateway (depends on all services)
  ↑
Client (depends on api-gateway)
```

## Scalability Considerations

### Current Limitations (Lab Project)

- Single instance per service
- No load balancing
- No caching layer
- No message queue for async operations
- localStorage for JWT (client-side)

### Production Improvements

1. **Horizontal Scaling**: Multiple instances behind load balancer
2. **Caching**: Redis for JWT verification, room availability
3. **Message Queue**: RabbitMQ/Kafka for event processing
4. **Database**: Connection pooling, read replicas
5. **API Gateway**: Nginx/Kong with advanced routing
6. **Monitoring**: Prometheus + Grafana
7. **Tracing**: Jaeger for distributed tracing

## Error Handling Strategy

### Service-Level Errors

```typescript
try {
	// Validate input (Zod)
	// Business logic
	// Database operation
	res.json(result);
} catch (error) {
	if (error instanceof ZodError) {
		return res.status(400).json({ error: error.message });
	}
	if (error instanceof PrismaError) {
		// Handle DB errors
	}
	next(error); // Pass to global error handler
}
```

### Client-Level Errors

- **Network Errors**: Retry with exponential backoff
- **401 Unauthorized**: Automatic token refresh attempt
- **Validation Errors**: Display inline with form
- **Server Errors**: User-friendly message + error logging

## Monitoring & Observability

### Logging Strategy

All significant events are logged to central Logs Service:

- User actions: register, login, logout
- Resource operations: room/booking CRUD
- Security events: token verification, unauthorized access
- System events: service startup, errors

### Log Structure

```json
{
	"timestamp": "2024-12-06T10:30:00Z",
	"serviceName": "crud-service",
	"action": "booking.created",
	"userId": "uuid",
	"details": {
		"bookingId": "uuid",
		"roomId": "uuid",
		"startTime": "2024-12-10T14:00:00Z"
	},
	"ipAddress": "192.168.1.100"
}
```

## Performance Characteristics

### Expected Response Times (Lab Environment)

- Auth operations: 200-500ms
- Room listing: 100-300ms
- Booking creation: 300-600ms (includes conflict check)
- Log queries: 200-400ms (with filters)

### Database Indexes

- Users: email (unique)
- Rooms: name (unique)
- Bookings: roomId, userId, startTime, endTime
- Logs: serviceName, action, userId, timestamp

## Development vs Production

### Development (Current)

- Hot-reload for all services
- Detailed error messages
- Minimal security hardening
- localStorage for tokens
- In-memory sessions

### Production Requirements

- HTTPS everywhere
- HTTP-only secure cookies
- Secrets in vault (not .env)
- Database connection pooling
- Rate limiting per user
- CSRF protection
- Input sanitization
- Audit logging
- Backup strategy
- Monitoring & alerting
