# Timefold Scheduler Integration

## Overview
This application now uses Timefold, an AI constraint satisfaction solver, to generate optimized timetables instead of the greedy/backtracking algorithms.

## Setup

### 1. Start the Timefold Java Backend
The application expects a Timefold solver service running at `http://localhost:8080`.

#### Option A: Using Docker
```bash
docker run -d -p 8080:8080 timefoldai/timefold-solver-school-timetabling:latest
```

#### Option B: From Source
Clone and run the Timefold quickstart:
```bash
git clone https://github.com/TimefoldAI/timefold-quickstarts.git
cd timefold-quickstarts/java/school-timetabling
mvn spring-boot:run
```

The Timefold service should be accessible at: `http://localhost:8080`

### 2. Configure Node Backend
Set the Timefold API URL (optional, defaults to `http://localhost:8080`):
```bash
export TIMEFOLD_API_URL=http://localhost:8080
```

### 3. Start the Node Application
```bash
npm run dev
```

## API Endpoint Changes

### POST /api/schedule/generate
**Before:** Used local greedy/backtracking scheduler  
**Now:** Calls Timefold solver service

**Request:**
```json
{
  "assignments": [
    {
      "courseId": "c1",
      "teacherId": "t1", 
      "studentGroupId": "sg1"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Schedule generated successfully by Timefold solver",
  "scheduled": 5,
  "total": 5,
  "classes": [
    {
      "id": "...",
      "courseId": "c1",
      "teacherId": "t1",
      "studentGroupId": "sg1",
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "09:00",
      "hasConflict": false
    }
  ]
}
```

## Constraints Enforced by Timefold

- ✅ A teacher cannot teach two classes in the same timeslot
- ✅ A student group cannot attend two classes in the same timeslot  
- ✅ No overlapping classes in the same day/time slot
- ✅ Time slots: Monday–Friday, 08:00 AM–05:00 PM (1-hour slots)

## Architecture

### Data Flow
1. **Frontend** → sends `POST /api/schedule/generate` with assignments
2. **Node Backend** (routes.ts) → enriches assignments with names/details
3. **Timefold Client** (timefoldClient.ts) → converts data to Timefold format
4. **Timefold Java Service** → solves the constraint satisfaction problem
5. **Node Backend** → converts solution back to application format
6. **Database** → persists the solved schedule
7. **Frontend** → renders the timetable

### Files Changed
- **Created:** `server/timefoldClient.ts` - Timefold API client
- **Modified:** `server/routes.ts` - Updated `/api/schedule/generate` endpoint
- **Deprecated:** `server/scheduler.ts` - No longer used (can be removed)

## Troubleshooting

### Connection Refused
If you see `Error calling Timefold solver`, ensure:
1. Timefold Java service is running at `http://localhost:8080`
2. Check firewall/network policies
3. Verify `TIMEFOLD_API_URL` environment variable if different

### Solver Timeout
The Timefold solver may take time for large problem instances. Default timeout is 30 seconds. Adjust in timefoldClient.ts if needed:
```typescript
const response = await fetch(..., { timeout: 60000 }); // 60 seconds
```

## Frontend Considerations

No UI changes required. Existing features continue to work:
- Filters operate on the solved schedule
- AM/PM time display works as before
- Conflict detection still applies to manually added classes
- Smart suggestions still available for manual scheduling
