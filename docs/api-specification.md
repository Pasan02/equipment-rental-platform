# API Specification — Equipment Rental Management Platform

> **Document Version**: 1.0  
> **Last Updated**: 2026-07-29  
> **Base URL**: `/api/v1`  
> **Authentication**: JWT Bearer Token  
> **Documentation**: Swagger UI at `/api/docs`

---

## API Conventions

### Base URL
```
https://api.example.com/api/v1
```

### Authentication
All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <access_token>
```

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "statusCode": 400
}
```

### Standard Query Parameters (for list endpoints)
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 10 | Items per page (max 100) |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `search` | string | - | Search keyword |

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK — Request succeeded |
| 201 | Created — Resource created |
| 400 | Bad Request — Validation error |
| 401 | Unauthorized — Missing or invalid token |
| 403 | Forbidden — Insufficient permissions |
| 404 | Not Found — Resource not found |
| 409 | Conflict — Duplicate resource |
| 429 | Too Many Requests — Rate limit exceeded |
| 500 | Internal Server Error |

---

## 1. Authentication Module

### `POST /auth/register`
Register a new customer account.

**Access**: Public  
**Rate Limit**: 5/min

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecureP@ss1",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+94771234567"
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| email | Required, valid email, unique |
| password | Required, min 8 chars, must contain uppercase, lowercase, number, special char |
| firstName | Required, min 2, max 100 chars |
| lastName | Required, min 2, max 100 chars |
| phone | Optional, valid phone format |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "createdAt": "2026-07-29T10:00:00Z"
  },
  "message": "Registration successful"
}
```

---

### `POST /auth/login`
Authenticate user and receive tokens.

**Access**: Public  
**Rate Limit**: 5/min

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecureP@ss1"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    }
  }
}
```

---

### `POST /auth/refresh`
Refresh an expired access token.

**Access**: Public

**Request Body:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 900
  }
}
```

---

### `POST /auth/forgot-password`
Request a password reset email.

**Access**: Public  
**Rate Limit**: 3/min

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

---

### `POST /auth/reset-password`
Reset password using token from email.

**Access**: Public

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecureP@ss1"
}
```

---

### `POST /auth/logout`
Logout and revoke refresh token.

**Access**: Authenticated

**Request Body:**
```json
{
  "refreshToken": "current_refresh_token"
}
```

---

## 2. Users Module

### `GET /users`
List all users (admin only).

**Access**: ADMIN  
**Query Parameters**: Standard pagination + `role` filter

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+94771234567",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-07-29T10:00:00Z",
      "_count": {
        "reservations": 5
      }
    }
  ],
  "meta": { ... }
}
```

---

### `GET /users/:id`
Get user details.

**Access**: ADMIN, or own profile

---

### `PATCH /users/:id`
Update user details.

**Access**: ADMIN, or own profile (limited fields)

**Request Body (Admin):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+94771234567",
  "role": "STAFF",
  "isActive": true
}
```

**Request Body (Self):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+94771234567"
}
```

---

### `PATCH /users/:id/change-password`
Change user password.

**Access**: Authenticated (own account)

**Request Body:**
```json
{
  "currentPassword": "OldP@ss1",
  "newPassword": "NewP@ss1"
}
```

---

## 3. Categories Module

### `GET /categories`
List all categories.

**Access**: Public

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Camera Gear",
      "slug": "camera-gear",
      "description": "Professional cameras and accessories",
      "imageUrl": "https://...",
      "_count": {
        "equipment": 15
      }
    }
  ]
}
```

---

### `POST /categories`
Create a category.

**Access**: ADMIN

**Request Body:**
```json
{
  "name": "Camera Gear",
  "description": "Professional cameras and accessories",
  "imageUrl": "https://..."
}
```

---

### `PUT /categories/:id`
Update a category.

**Access**: ADMIN

---

### `DELETE /categories/:id`
Delete a category (only if no equipment assigned).

**Access**: ADMIN

---

## 4. Equipment Module

### `GET /equipment`
List equipment with filtering and search.

**Access**: Public (only active items), ADMIN/STAFF (all items)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search name and description |
| `categoryId` | uuid | Filter by category |
| `minPrice` | number | Minimum rental price |
| `maxPrice` | number | Maximum rental price |
| `available` | boolean | Only available items |
| `isActive` | boolean | Admin filter for active/inactive |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Canon EOS R5",
      "description": "Full-frame mirrorless camera...",
      "rentalPricePerDay": 150.00,
      "depositAmount": 500.00,
      "stockQuantity": 5,
      "availableQuantity": 3,
      "specifications": {
        "sensor": "45MP Full-Frame CMOS",
        "video": "8K RAW, 4K 120fps",
        "weight": "738g"
      },
      "qrCode": "data:image/png;base64,...",
      "isActive": true,
      "category": {
        "id": "uuid",
        "name": "Camera Gear",
        "slug": "camera-gear"
      },
      "images": [
        {
          "id": "uuid",
          "imageUrl": "https://...",
          "sortOrder": 0,
          "isPrimary": true
        }
      ],
      "createdAt": "2026-07-29T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### `GET /equipment/:id`
Get equipment details.

**Access**: Public

---

### `GET /equipment/:id/availability`
Check equipment availability for date range.

**Access**: Authenticated

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | date | Pickup date (YYYY-MM-DD) |
| `endDate` | date | Return date (YYYY-MM-DD) |
| `quantity` | number | Requested quantity |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "equipmentId": "uuid",
    "available": true,
    "availableQuantity": 3,
    "requestedQuantity": 1,
    "conflictingReservations": 2
  }
}
```

---

### `POST /equipment`
Create new equipment.

**Access**: ADMIN

**Request Body:**
```json
{
  "name": "Canon EOS R5",
  "description": "Full-frame mirrorless camera...",
  "rentalPricePerDay": 150.00,
  "depositAmount": 500.00,
  "stockQuantity": 5,
  "categoryId": "uuid",
  "specifications": {
    "sensor": "45MP Full-Frame CMOS",
    "video": "8K RAW, 4K 120fps"
  },
  "imageIds": ["upload-uuid-1", "upload-uuid-2"]
}
```

---

### `PUT /equipment/:id`
Update equipment.

**Access**: ADMIN

---

### `DELETE /equipment/:id`
Soft delete (deactivate) equipment.

**Access**: ADMIN

---

## 5. Reservations Module

### `POST /reservations`
Create a new reservation.

**Access**: CUSTOMER

**Request Body:**
```json
{
  "pickupDate": "2026-08-01",
  "returnDate": "2026-08-05",
  "notes": "Need for outdoor shoot",
  "items": [
    {
      "equipmentId": "uuid-1",
      "quantity": 1
    },
    {
      "equipmentId": "uuid-2",
      "quantity": 2
    }
  ]
}
```

**Validation Rules:**
| Rule | Description |
|------|-------------|
| pickupDate | Must be at least 24 hours from now |
| returnDate | Must be after pickupDate |
| items | At least 1 item required |
| quantity | Must be > 0 and ≤ available quantity |
| availability | All items must be available for the date range |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reservationNumber": "RES-20260729-001",
    "status": "PENDING",
    "pickupDate": "2026-08-01",
    "returnDate": "2026-08-05",
    "totalAmount": 1200.00,
    "depositTotal": 700.00,
    "items": [
      {
        "equipment": { "id": "uuid", "name": "Canon EOS R5" },
        "quantity": 1,
        "unitPrice": 150.00,
        "subtotal": 600.00,
        "deposit": 500.00
      }
    ],
    "createdAt": "2026-07-29T10:00:00Z"
  }
}
```

---

### `GET /reservations`
List reservations.

**Access**: CUSTOMER (own), STAFF/ADMIN (all)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `customerId` | uuid | Filter by customer (admin/staff) |
| `fromDate` | date | Filter pickup date from |
| `toDate` | date | Filter pickup date to |

---

### `GET /reservations/:id`
Get reservation details.

**Access**: CUSTOMER (own), STAFF/ADMIN

---

### `PATCH /reservations/:id/approve`
Approve a pending reservation.

**Access**: STAFF, ADMIN

**Request Body:**
```json
{
  "notes": "All documents verified"
}
```

---

### `PATCH /reservations/:id/reject`
Reject a pending reservation.

**Access**: STAFF, ADMIN

**Request Body:**
```json
{
  "rejectionReason": "Incomplete documentation"
}
```

---

### `PATCH /reservations/:id/activate`
Mark reservation as active (equipment picked up).

**Access**: STAFF, ADMIN

---

### `PATCH /reservations/:id/return`
Mark reservation as returned.

**Access**: STAFF, WAREHOUSE

**Request Body:**
```json
{
  "notes": "All equipment returned in good condition",
  "damages": []
}
```

---

### `PATCH /reservations/:id/cancel`
Cancel a reservation.

**Access**: CUSTOMER (own, if PENDING/APPROVED), ADMIN

---

## 6. Payments Module

### `POST /payments`
Create a mock payment.

**Access**: CUSTOMER, ADMIN

**Request Body:**
```json
{
  "reservationId": "uuid",
  "amount": 1200.00,
  "type": "RENTAL",
  "paymentMethod": "credit_card"
}
```

---

### `GET /payments`
List payments.

**Access**: CUSTOMER (own), ADMIN/STAFF (all)

**Query Parameters**: Standard pagination + `status`, `type`, `reservationId`

---

### `GET /payments/:id`
Get payment details.

**Access**: CUSTOMER (own), ADMIN/STAFF

---

### `POST /payments/:id/process`
Process (mock approve) a payment.

**Access**: ADMIN

**Success Response**: Status changes to `PAID`, `paid_at` is set.

---

### `POST /payments/:id/refund`
Refund a payment.

**Access**: ADMIN

---

## 7. Inventory Module

### `GET /inventory`
View inventory stock levels.

**Access**: WAREHOUSE, ADMIN

---

### `GET /inventory/:equipmentId/history`
View inventory history for equipment.

**Access**: WAREHOUSE, ADMIN

---

### `POST /inventory/receive`
Record equipment received.

**Access**: WAREHOUSE

**Request Body:**
```json
{
  "equipmentId": "uuid",
  "quantity": 5,
  "notes": "New stock from supplier"
}
```

---

### `POST /inventory/release`
Record equipment released.

**Access**: WAREHOUSE

**Request Body:**
```json
{
  "equipmentId": "uuid",
  "quantity": 2,
  "reservationId": "uuid",
  "notes": "Released for reservation RES-20260729-001"
}
```

---

### `POST /inventory/damage`
Record equipment damage.

**Access**: WAREHOUSE

**Request Body:**
```json
{
  "equipmentId": "uuid",
  "quantity": 1,
  "notes": "Lens cracked during transport",
  "reservationId": "uuid"
}
```

---

### `POST /inventory/maintenance`
Record equipment sent for maintenance.

**Access**: WAREHOUSE

**Request Body:**
```json
{
  "equipmentId": "uuid",
  "quantity": 1,
  "notes": "Scheduled sensor cleaning"
}
```

---

## 8. Notifications Module

### `GET /notifications`
List notifications for current user.

**Access**: Authenticated

**Query Parameters**: Standard pagination + `isRead` filter

---

### `GET /notifications/unread-count`
Get unread notification count.

**Access**: Authenticated

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### `PATCH /notifications/:id/read`
Mark notification as read.

**Access**: Authenticated (own)

---

### `PATCH /notifications/read-all`
Mark all notifications as read.

**Access**: Authenticated

---

## 9. Uploads Module

### `POST /uploads`
Upload a file to Cloudflare R2.

**Access**: Authenticated

**Request**: `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The file to upload |
| `type` | string | `IDENTITY_DOCUMENT`, `RENTAL_AGREEMENT`, or `EQUIPMENT_IMAGE` |
| `reservationId` | string | Optional, link to reservation |

**Validation:**
| Type | Accepted Formats | Max Size |
|------|-------------------|----------|
| IDENTITY_DOCUMENT | PDF, JPG, PNG | 10MB |
| RENTAL_AGREEMENT | PDF | 10MB |
| EQUIPMENT_IMAGE | JPG, PNG, WebP | 5MB |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileName": "id_document.pdf",
    "fileUrl": "https://r2.example.com/uploads/...",
    "mimeType": "application/pdf",
    "fileSize": 245760,
    "type": "IDENTITY_DOCUMENT",
    "createdAt": "2026-07-29T10:00:00Z"
  }
}
```

---

### `GET /uploads/:id`
Get upload details / download file.

**Access**: Authenticated (own), ADMIN/STAFF

---

### `DELETE /uploads/:id`
Delete an uploaded file.

**Access**: Authenticated (own, if not linked to approved reservation), ADMIN

---

## 10. Dashboard Module

### `GET /dashboard/stats`
Get overview statistics.

**Access**: ADMIN

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 150,
    "activeReservations": 23,
    "totalRevenue": 45600.00,
    "equipmentUtilization": 68.5,
    "monthlyRevenue": 12300.00,
    "pendingReservations": 8,
    "totalEquipment": 85,
    "revenueGrowth": 15.2
  }
}
```

---

### `GET /dashboard/most-rented`
Get most rented equipment.

**Access**: ADMIN

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Number of items (default 10) |
| `period` | string | `week`, `month`, `quarter`, `year` |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "equipmentId": "uuid",
      "equipmentName": "Canon EOS R5",
      "category": "Camera Gear",
      "totalRentals": 45,
      "totalRevenue": 6750.00,
      "imageUrl": "https://..."
    }
  ]
}
```

---

### `GET /dashboard/reservation-trends`
Get reservation trends over time.

**Access**: ADMIN

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | `daily`, `weekly`, `monthly` |
| `fromDate` | date | Start date |
| `toDate` | date | End date |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-07-01",
      "total": 15,
      "pending": 3,
      "approved": 5,
      "active": 4,
      "returned": 2,
      "cancelled": 1
    }
  ]
}
```

---

## 11. Activity Logs Module

### `GET /activity-logs`
List activity logs.

**Access**: ADMIN

**Query Parameters**: Standard pagination + `userId`, `action`, `entityType`, `fromDate`, `toDate`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "action": "RESERVATION_CREATED",
      "entityType": "reservation",
      "entityId": "uuid",
      "oldValues": null,
      "newValues": {
        "status": "PENDING",
        "totalAmount": 1200.00
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-07-29T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

## Rate Limiting Configuration

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Authentication (`/auth/*`) | 5 requests | 1 minute |
| File Uploads (`/uploads`) | 10 requests | 1 minute |
| General API (default) | 100 requests | 1 minute |
| Dashboard (`/dashboard/*`) | 30 requests | 1 minute |

---

## Swagger/OpenAPI

Auto-generated documentation available at:
- **Swagger UI**: `GET /api/docs`
- **OpenAPI JSON**: `GET /api/docs-json`
- **OpenAPI YAML**: `GET /api/docs-yaml`

Configured using `@nestjs/swagger` decorators on all controllers and DTOs.
