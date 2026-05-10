# Phase 5: Operations Layer - API Reference

## 🎯 Overview

Phase 5 introduces 4 comprehensive modules for managing event operations:
- **Vendor Management** - Event vendors and suppliers
- **Resource Management** - Equipment and inventory tracking
- **Scheduling** - Time slot management with conflict detection
- **Budget Management** - Financial planning and expense tracking

---

## 📦 Vendor Module

### Vendor CRUD

**Create Vendor** - `POST /api/v1/vendors`
- Required: name, category, contactPerson, email, phone
- Categories: catering, decoration, equipment, transportation, other
- Returns: Vendor object with ID

**List Vendors** - `GET /api/v1/vendors`
- Query params: category, status
- Returns: { count, vendors[] }

**Get Vendor** - `GET /api/v1/vendors/:vendorId`
- Returns: Vendor object

**Update Vendor** - `PUT /api/v1/vendors/:vendorId`
- Body: Any vendor fields to update
- Returns: Updated vendor

**Delete Vendor** - `DELETE /api/v1/vendors/:vendorId`
- Returns: { success, message }

### Vendor Assignments

**Assign to Event** - `POST /api/v1/events/:eventId/vendors/:vendorId`
- Body: { amount?, notes? }
- Returns: Assignment object

**Get Event Vendors** - `GET /api/v1/events/:eventId/vendors`
- Returns: { eventId, count, vendors[] } with vendorDetails

**Get Vendor Assignments** - `GET /api/v1/vendors/:vendorId/assignments`
- Returns: { vendorId, count, assignments[] }

**Update Assignment Status** - `PUT /api/v1/vendors/assignments/:assignmentId/status`
- Body: { status } (assigned, confirmed, completed, cancelled)
- Returns: Updated assignment

**Rate Vendor** - `POST /api/v1/vendors/:vendorId/rate`
- Body: { rating } (0-5)
- Returns: Updated vendor with new rating

---

## 🎛️ Resource Module

### Resource CRUD

**Create Resource** - `POST /api/v1/resources`
- Required: name, type, quantity
- Types: audio, visual, lighting, seating, stage, decoration, other
- Returns: Resource object

**List Resources** - `GET /api/v1/resources`
- Query params: type, status, condition
- Returns: { count, resources[] }

**Get Available Resources** - `GET /api/v1/resources/available`
- Query params: type, status, condition
- Returns: { count, resources[] } (with availableQuantity > 0)

**Get Resource** - `GET /api/v1/resources/:resourceId`
- Returns: Resource object

**Update Resource** - `PUT /api/v1/resources/:resourceId`
- Body: Any resource fields
- Returns: Updated resource

**Delete Resource** - `DELETE /api/v1/resources/:resourceId`
- Returns: { success, message }

### Resource Allocation

**Allocate to Event** - `POST /api/v1/events/:eventId/resources/:resourceId`
- Required: allocatedQuantity, startDate, endDate
- Checks: Availability, Conflict detection
- Returns: Allocation object or conflict error

**Get Event Resources** - `GET /api/v1/events/:eventId/resources`
- Returns: { eventId, count, resources[] } with resourceDetails

**Get Resource Allocations** - `GET /api/v1/resources/:resourceId/allocations`
- Returns: { resourceId, count, allocations[] }

**Update Allocation Status** - `PUT /api/v1/resources/allocations/:allocationId/status`
- Body: { status } (allocated, in-use, returned, damaged)
- Returns: Updated allocation (auto-updates availability if returned)

**Update Maintenance** - `PUT /api/v1/resources/:resourceId/maintenance`
- Body: { maintenanceDate }
- Returns: Updated resource

---

## 📅 Scheduling Module

### Time Slot Management

**Create Time Slot** - `POST /api/v1/events/:eventId/schedule`
- Required: venue, startTime, endTime, capacity
- Automatically detects conflicts
- Returns: Slot object

**Get Event Schedule** - `GET /api/v1/events/:eventId/schedule`
- Returns: { eventId, count, slots[] }

**Get Time Slot** - `GET /api/v1/schedule/:slotId`
- Returns: Slot object

**Update Time Slot** - `PUT /api/v1/schedule/:slotId`
- Body: Slot fields to update
- Re-checks conflicts after update
- Returns: Updated slot

**Delete Time Slot** - `DELETE /api/v1/schedule/:slotId`
- Returns: { success, message }

### Conflict Management

**Get All Conflicts** - `GET /api/v1/schedule/conflicts`
- Query params: resolved (true/false), severity (low/medium/high)
- Returns: { count, conflicts[] }

**Get Slot Conflicts** - `GET /api/v1/schedule/:slotId/conflicts`
- Returns: { slotId, count, conflicts[] }

**Resolve Conflict** - `PUT /api/v1/schedule/conflicts/:conflictId/resolve`
- Body: { resolution } (description of how it was resolved)
- Returns: Updated conflict

**Check Venue Availability** - `GET /api/v1/schedule/venue/:venue/available`
- Query params: startTime, endTime
- Returns: { venue, startTime, endTime, available: boolean }

**Get Schedule Overview** - `GET /api/v1/events/:eventId/schedule/overview`
- Returns: Statistics with totalSlots, totalConflicts, resolved count, slots[], conflicts[]

---

## 💰 Budget Module

### Budget Management

**Create Budget** - `POST /api/v1/events/:eventId/budget`
- Required: totalAllocation
- Optional: budgetBreakdown[], currency, notes
- Returns: Budget object

**Get Event Budget** - `GET /api/v1/events/:eventId/budget`
- Returns: Budget object

**Get Budget** - `GET /api/v1/budget/:budgetId`
- Returns: Budget object

**Update Budget** - `PUT /api/v1/budget/:budgetId`
- Body: Budget fields (blocked if already approved)
- Returns: Updated budget

**Approve Budget** - `POST /api/v1/budget/:budgetId/approve`
- Body: { userId }
- Returns: Updated budget with approvalStatus: approved

**Reject Budget** - `POST /api/v1/budget/:budgetId/reject`
- Returns: Updated budget with approvalStatus: rejected

### Expense Management

**Log Expense** - `POST /api/v1/budget/:budgetId/expense`
- Required: category, description, amount
- Categories: vendor, resource, supplies, personnel, other
- Checks: Amount doesn't exceed remaining budget
- Returns: Expense object

**Get Budget Expenses** - `GET /api/v1/budget/:budgetId/expenses`
- Returns: { budgetId, count, expenses[] }

**Get Expense** - `GET /api/v1/budget/expense/:expenseId`
- Returns: Expense object

**Update Expense** - `PUT /api/v1/budget/expense/:expenseId`
- Body: Expense fields (can't update amount if paid)
- Returns: Updated expense

**Mark as Paid** - `POST /api/v1/budget/expense/:expenseId/mark-paid`
- Body: { paymentMethod }
- Sets paymentStatus: paid, paidDate: now()
- Returns: Updated expense

### Budget Reporting

**Get Budget Summary** - `GET /api/v1/budget/:budgetId/summary`
- Returns: Overview with:
  - totalAllocation, totalExpenses, remaining
  - utilisationPercent
  - approvalStatus
  - expenseCount, paidExpenses, pendingExpenses
  - expensesByCategory breakdown
  - expenses array

**Get Budget vs Actual** - `GET /api/v1/budget/:budgetId/vs-actual`
- Returns: Comparison with:
  - breakdown (planned by category)
  - actual (spent by category)
  - variance with difference and variancePercent for each

---

## 🔐 RBAC Rules

### Public Access
- GET vendors, resources, schedule info
- GET budget summaries (for event participants)

### Coordinator+ Required
- POST/PUT/DELETE vendors
- POST/PUT/DELETE resources
- POST/PUT/DELETE schedule
- POST budget and expenses

### Admin Only
- DELETE vendors
- DELETE resources
- DELETE schedule slots
- Approve/reject budgets
- Update maintenance dates

---

## 📝 Example Workflows

### Assigning a Vendor to Event
```bash
# 1. Create vendor (if needed)
POST /api/v1/vendors
{ name: "Catering Co", category: "catering", ... }

# 2. Assign to event
POST /api/v1/events/evt-123/vendors/vnd-456
{ amount: 50000, notes: "Full catering" }

# 3. Update status as things progress
PUT /api/v1/vendors/assignments/asg-789/status
{ status: "confirmed" }
```

### Allocating Resources
```bash
# 1. Create resource
POST /api/v1/resources
{ name: "Projector", type: "visual", quantity: 5 }

# 2. Check availability
GET /api/v1/resources/available?type=visual

# 3. Allocate to event
POST /api/v1/events/evt-123/resources/res-456
{ allocatedQuantity: 2, startDate: "2024-05-15T10:00", endDate: "2024-05-15T18:00" }
```

### Managing Budget
```bash
# 1. Create budget
POST /api/v1/events/evt-123/budget
{ totalAllocation: 100000 }

# 2. Log expenses as they occur
POST /api/v1/budget/bdg-456/expense
{ category: "vendor", description: "Catering", amount: 50000 }

# 3. Track status
GET /api/v1/budget/bdg-456/summary
```

---

## 🔗 Integration with Other Modules

### Vendor ↔ Event
- Vendors assigned to events
- Tracks vendor participation history

### Resource ↔ Scheduling
- Resources allocated to time slots
- Conflict detection prevents double-booking

### Budget ↔ Vendor/Resource
- Expenses categorized by type
- Can link expenses to vendor/resource allocations

---

## 🚀 Frontend Integration

See `/frontend/lib/`:
- `vendor-api.ts` - Vendor API client
- `resource-api.ts` - Resource API client
- `scheduling-api.ts` - Scheduling API client
- `budget-api.ts` - Budget API client

All clients handle authentication and error handling automatically.
