# Quick Start - MongoDB & Sub-Category Fix

## ⚡ TL;DR

### What's New
- ✅ MongoDB integrated for images, documents, analytics
- ✅ Sub-category slug error fixed with automatic migration
- ✅ 6 MongoDB collections ready to use
- ✅ Easy React component helpers

---

## 🚀 Deploy in 5 Minutes

### Step 1: Update Environment Variables
In Vercel Settings → Environment Variables:
```
VITE_MONGODB_URI = mongodb+srv://subhonehealthgroup_db_user:YOUR_NEW_PASSWORD@cluster0.m528hq0.mongodb.net/
VITE_MONGODB_DB = subhone_store
```

### Step 2: Rotate MongoDB Password
1. https://cloud.mongodb.com/ → Database Access
2. Click `subhonehealthgroup_db_user` → Edit Password
3. Generate new password
4. Copy connection string to `VITE_MONGODB_URI`

### Step 3: Deploy
```bash
git add .
git commit -m "feat: MongoDB integration and sub-category slug fix"
git push origin main
npx vercel --prod --yes
```

---

## 💻 Use MongoDB in Your Code

### Save Product Images
```typescript
import { saveProductImages } from "@/lib/mongodbClient";

await saveProductImages(productId, imageUrl, galleryImages, webImageUrl);
```

### Get Product Images
```typescript
import { getProductImages } from "@/lib/mongodbClient";

const { success, images } = await getProductImages(productId);
```

### Save Documents (Prescriptions, Invoices)
```typescript
import { saveUserDocument } from "@/lib/mongodbClient";

await saveUserDocument(
  userId,
  "prescription",        // or "invoice", "receipt", "agreement"
  documentUrl,
  fileName,
  fileSize,
  mimeType
);
```

### Log User Actions (Audit Trail)
```typescript
import { logUserAction } from "@/lib/mongodbClient";

await logUserAction(userId, "ORDER_PLACED", { orderId: "123" });
```

### Log Notifications
```typescript
import { logNotification } from "@/lib/mongodbClient";

await logNotification(
  userId,
  "push",  // or "email", "sms", "in_app"
  "Order Confirmed",
  "Your order has been confirmed!"
);
```

### Archive Orders
```typescript
import { archiveOrder } from "@/lib/mongodbClient";

await archiveOrder(orderId, userId, orderData, "automatic_archive");
```

### Delivery Analytics
```typescript
import { saveDeliveryAnalytics } from "@/lib/mongodbClient";

await saveDeliveryAnalytics(
  partnerId,
  12,           // orders completed
  45.5,         // distance in km
  18,           // avg delivery time in mins
  [4.5, 5, 4],  // ratings
  450           // earnings in rupees
);
```

---

## 📊 MongoDB Collections Ready

1. **product_images** - Product photos & gallery
2. **user_documents** - Prescriptions, invoices, agreements
3. **order_archives** - Historical orders for analytics
4. **delivery_analytics** - Partner performance metrics
5. **user_audit_logs** - Security audit trail
6. **notifications** - Email, SMS, push history

All collections auto-created on first use. Indexes auto-created for performance.

---

## 🐛 Sub-Category Fix

**Problem**: "Error adding sub-category: column "slug" does not exist"

**Solution**: Automatic migration ✅
- Runs on app startup
- Adds `slug` column to `sub_categories`
- Works with old and new schema
- Safe to deploy multiple times

Try adding a sub-category now - should work! 🎉

---

## ⚠️ Important Notes

### Credentials Rotation
Old MongoDB password is exposed publicly:
- `njrc4zTmwUKB7hHb` - DO NOT USE
- Generate new password immediately
- Update `VITE_MONGODB_URI` with new credentials

### Environment Variables
- Use `.env.local` for development
- Use Vercel Settings for production
- Never commit credentials to git

### Security
15 security vulnerabilities identified in codebase:
- See `/security-fixes-detailed-prompt.md` for fixes
- Recommend addressing after deployment

---

## 🆘 Troubleshooting

### MongoDB Connection Failed
- Check `VITE_MONGODB_URI` is set
- Verify IP whitelist in MongoDB Atlas (0.0.0.0/0 allows all)
- Check network connectivity

### Collections Not Created
- Collections are auto-created on first use
- Check MongoDB Atlas console to verify

### Sub-Category Still Showing Error
- Migration runs on app startup
- Check browser console for migration logs
- May need page refresh

### Build Fails
- Run `npm install` to ensure all dependencies
- Check for TypeScript errors: `npm run build`
- Verify no hardcoded credentials in source

---

## 📖 Documentation

- **Full Setup Guide**: `MONGODB_SETUP.md`
- **Implementation Details**: `IMPLEMENTATION_COMPLETE.md`
- **Service Functions**: `src/lib/mongodbServices.ts`
- **Component Helpers**: `src/lib/mongodbClient.ts`
- **API Handler**: `api/mongodb.ts`

---

## ✅ After Deployment

1. App loads without errors
2. Can add sub-categories
3. MongoDB collections visible in Atlas console
4. Check Vercel logs for migration messages
5. Test saving product images to MongoDB
6. Monitor delivery analytics collection

---

## 🎯 Next Steps

**Immediate** (if needed):
- Deploy to Vercel
- Rotate MongoDB credentials
- Verify sub-categories work

**Optional** (when ready):
- Implement analytics dashboard
- Archive old orders to MongoDB
- Build notification center
- Fix security vulnerabilities

---

**Questions?** Check `MONGODB_SETUP.md` or `IMPLEMENTATION_COMPLETE.md`

**Ready to deploy?** Run:
```bash
git push origin main && npx vercel --prod --yes
```
