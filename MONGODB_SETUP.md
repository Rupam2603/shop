# MongoDB Integration Setup Guide

## Environment Variables

Add these to your `.env.local` (development) and Vercel Environment Variables (production):

```bash
# MongoDB Atlas Connection
VITE_MONGODB_URI=mongodb+srv://subhonehealthgroup_db_user:njrc4zTmwUKB7hHb@cluster0.m528hq0.mongodb.net/
VITE_MONGODB_DB=subhone_store

# Neon PostgreSQL (existing)
DATABASE_URL=postgresql://...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

⚠️ **SECURITY WARNING**: The MongoDB connection string is now exposed. Please rotate credentials:
1. Go to https://cloud.mongodb.com/
2. Navigate to Database Access
3. Reset password for `subhonehealthgroup_db_user`
4. Update the connection string with new credentials

---

## Available MongoDB Collections

### 1. **product_images**
Store product images, gallery photos, and URLs
```typescript
{
  _id: ObjectId,
  productId: string,
  imageUrl: string,
  galleryImages: string[],
  webImageUrl: string,
  thumbnailUrl: string,
  uploadedAt: Date,
  uploadedBy: string,
  altText?: string
}
```

### 2. **user_documents**
Store prescriptions, invoices, agreements
```typescript
{
  _id: ObjectId,
  userId: string,
  documentType: "prescription" | "invoice" | "receipt" | "agreement" | "other",
  documentUrl: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  uploadedAt: Date,
  expiresAt?: Date,
  metadata?: Record<string, any>
}
```

### 3. **order_archives**
Archived/historical orders for analytics
```typescript
{
  _id: ObjectId,
  orderId: string,
  userId: string,
  orderData: Record<string, any>,
  archivedAt: Date,
  reason: string
}
```

### 4. **delivery_analytics**
Delivery partner performance metrics
```typescript
{
  _id: ObjectId,
  deliveryPartnerId: string,
  date: Date,
  ordersCompleted: number,
  totalDistance: number,
  averageDeliveryTime: number,
  ratings: number[],
  averageRating: number,
  earnings: number,
  metadata?: Record<string, any>
}
```

### 5. **user_audit_logs**
Security audit trail of user actions
```typescript
{
  _id: ObjectId,
  userId: string,
  action: string,
  timestamp: Date,
  ipAddress?: string,
  userAgent?: string,
  details?: Record<string, any>
}
```

### 6. **notifications**
User notification history
```typescript
{
  _id: ObjectId,
  userId: string,
  type: "email" | "sms" | "push" | "in_app",
  title: string,
  message: string,
  sentAt: Date,
  readAt?: Date,
  metadata?: Record<string, any>
}
```

---

## Usage Examples

### From React Components

```typescript
import { fetchMongoData } from "@/lib/mongodbClient";

// Save product images
const result = await fetchMongoData("save_product_image", {
  productId: "123",
  imageUrl: "https://...",
  galleryImages: ["https://...", "https://..."],
  webImageUrl: "https://...",
  uploadedBy: "admin"
});

// Get product images
const images = await fetchMongoData("get_product_images", {
  productId: "123"
});

// Save user document
const docResult = await fetchMongoData("save_user_document", {
  userId: "user-uuid",
  documentType: "prescription",
  documentUrl: "https://...",
  fileName: "prescription.pdf",
  fileSize: 245000,
  mimeType: "application/pdf"
});

// Archive order
await fetchMongoData("archive_order", {
  orderId: "order-123",
  userId: "user-uuid",
  orderData: { /* full order object */ },
  reason: "automatic_archive"
});

// Save delivery analytics
await fetchMongoData("save_delivery_analytics", {
  deliveryPartnerId: "partner-uuid",
  ordersCompleted: 12,
  totalDistance: 45.5,
  averageDeliveryTime: 18,
  ratings: [4.5, 5, 4, 4.5],
  earnings: 450
});

// Log user action
await fetchMongoData("log_user_action", {
  userId: "user-uuid",
  action: "ORDER_PLACED",
  details: { orderId: "123", amount: 999 },
  ipAddress: "192.168.1.1",
  userAgent: navigator.userAgent
});

// Log notification
const notifId = await fetchMongoData("log_notification", {
  userId: "user-uuid",
  type: "push",
  title: "Order Confirmed",
  message: "Your order has been confirmed and will arrive soon",
  metadata: { orderId: "123" }
});
```

### From Server-Side API Routes

```typescript
// In api/custom-route.ts
import { getCollection } from "@/lib/mongodb";

export default async function handler(req, res) {
  const collection = await getCollection("product_images");
  
  const images = await collection.find({
    productId: req.query.productId
  }).toArray();
  
  return res.status(200).json(images);
}
```

---

## Database Indexes

The following indexes are automatically created on first API call:

- `product_images`: `productId`
- `user_documents`: `userId`, TTL on `expiresAt`
- `order_archives`: `userId`, `orderId`
- `delivery_analytics`: `deliveryPartnerId`, `date`
- `user_audit_logs`: `userId`, `timestamp`
- `notifications`: `userId`, `sentAt`

---

## Migration: Sub-Categories Slug Column

The app automatically runs migrations on startup to add the missing `slug` column to `sub_categories` table:

```sql
-- Migration adds:
ALTER TABLE sub_categories ADD COLUMN slug TEXT DEFAULT '';
ALTER TABLE sub_categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE sub_categories ADD CONSTRAINT unique_slug_per_category UNIQUE (category_id, slug);
```

This runs once and is idempotent - safe to deploy multiple times.

---

## Deployment Checklist

- [ ] Add `VITE_MONGODB_URI` to Vercel environment variables
- [ ] Add `VITE_MONGODB_DB` to Vercel environment variables
- [ ] Rotate MongoDB password in Atlas console
- [ ] Run `npm run build` to verify no errors
- [ ] Deploy to Vercel: `npx vercel --prod --yes`
- [ ] Test creating sub-categories (should work without error)
- [ ] Verify MongoDB collections are created in Atlas console

---

## Troubleshooting

### "column 'slug' does not exist"
- The migration will run automatically on app startup
- Check browser console for migration logs
- If still failing, verify database connection

### "MongoDB connection failed"
- Verify `VITE_MONGODB_URI` is correct
- Check IP whitelist in MongoDB Atlas (allow all: `0.0.0.0/0`)
- Ensure network connectivity

### "Collections not created"
- Collections are created on-demand when first accessed
- If manual creation needed:
  ```javascript
  const db = await getDB();
  await db.createCollection("product_images");
  ```

---

## Next Steps

1. ✅ MongoDB integration complete
2. ✅ API routes created (`/api/mongodb.ts`)
3. ✅ Service layer created (`mongodbServices.ts`)
4. ✅ Sub-category slug migration added
5. 📋 Update existing components to use MongoDB for images
6. 📋 Implement analytics dashboard using delivery_analytics
7. 📋 Set up notification system using notifications collection
8. 📋 Archive old orders to MongoDB for performance
