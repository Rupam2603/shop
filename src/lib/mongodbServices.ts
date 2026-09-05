import { getCollection } from "./mongodb";
import { ObjectId } from "mongodb";

/**
 * MongoDB Collections Interfaces
 */

export interface ProductImage {
  _id?: ObjectId;
  productId: string;
  imageUrl: string;
  galleryImages: string[];
  webImageUrl: string;
  thumbnailUrl: string;
  uploadedAt: Date;
  uploadedBy: string;
  altText?: string;
}

export interface UserDocument {
  _id?: ObjectId;
  userId: string;
  documentType: "prescription" | "invoice" | "receipt" | "agreement" | "other";
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface OrderArchive {
  _id?: ObjectId;
  orderId: string;
  userId: string;
  orderData: Record<string, any>;
  archivedAt: Date;
  reason: string;
}

export interface DeliveryAnalytics {
  _id?: ObjectId;
  deliveryPartnerId: string;
  date: Date;
  ordersCompleted: number;
  totalDistance: number;
  averageDeliveryTime: number;
  ratings: number[];
  averageRating: number;
  earnings: number;
  metadata?: Record<string, any>;
}

export interface UserAuditLog {
  _id?: ObjectId;
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface NotificationLog {
  _id?: ObjectId;
  userId: string;
  type: "email" | "sms" | "push" | "in_app";
  title: string;
  message: string;
  sentAt: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Product Images - Store product images, gallery, and URLs
 */
export async function saveProductImage(
  data: ProductImage
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const collection = await getCollection<ProductImage>("product_images");
    const result = await collection.insertOne({
      ...data,
      uploadedAt: new Date(),
    });
    return { success: true, id: result.insertedId.toString() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProductImages(
  productId: string
): Promise<ProductImage[]> {
  try {
    const collection = await getCollection<ProductImage>("product_images");
    const images = await collection.find({ productId }).toArray();
    return images;
  } catch (error) {
    console.error("Error fetching product images:", error);
    return [];
  }
}

export async function updateProductImage(
  id: string,
  updates: Partial<ProductImage>
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCollection<ProductImage>("product_images");
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * User Documents - Store prescriptions, invoices, agreements
 */
export async function saveUserDocument(
  data: UserDocument
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const collection = await getCollection<UserDocument>("user_documents");
    const result = await collection.insertOne({
      ...data,
      uploadedAt: new Date(),
    });
    return { success: true, id: result.insertedId.toString() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserDocuments(
  userId: string,
  documentType?: string
): Promise<UserDocument[]> {
  try {
    const collection = await getCollection<UserDocument>("user_documents");
    const query: any = { userId };
    if (documentType) query.documentType = documentType;
    const documents = await collection.find(query).sort({ uploadedAt: -1 }).toArray();
    return documents;
  } catch (error) {
    console.error("Error fetching user documents:", error);
    return [];
  }
}

export async function deleteUserDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCollection<UserDocument>("user_documents");
    await collection.deleteOne({ _id: new ObjectId(documentId) });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Order Archive - Store archived/old orders for analytics
 */
export async function archiveOrder(
  orderId: string,
  userId: string,
  orderData: Record<string, any>,
  reason: string = "automatic_archive"
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCollection<OrderArchive>("order_archives");
    await collection.insertOne({
      orderId,
      userId,
      orderData,
      archivedAt: new Date(),
      reason,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getArchivedOrders(userId: string): Promise<OrderArchive[]> {
  try {
    const collection = await getCollection<OrderArchive>("order_archives");
    const orders = await collection
      .find({ userId })
      .sort({ archivedAt: -1 })
      .toArray();
    return orders;
  } catch (error) {
    console.error("Error fetching archived orders:", error);
    return [];
  }
}

/**
 * Delivery Analytics - Track delivery partner performance
 */
export async function saveDeliveryAnalytics(
  data: DeliveryAnalytics
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCollection<DeliveryAnalytics>(
      "delivery_analytics"
    );
    await collection.insertOne({
      ...data,
      date: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDeliveryAnalytics(
  deliveryPartnerId: string,
  days: number = 30
): Promise<DeliveryAnalytics[]> {
  try {
    const collection = await getCollection<DeliveryAnalytics>(
      "delivery_analytics"
    );
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await collection
      .find({
        deliveryPartnerId,
        date: { $gte: startDate },
      })
      .sort({ date: -1 })
      .toArray();
    return analytics;
  } catch (error) {
    console.error("Error fetching delivery analytics:", error);
    return [];
  }
}

/**
 * User Audit Logs - Track user actions for security
 */
export async function logUserAction(
  userId: string,
  action: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCollection<UserAuditLog>("user_audit_logs");
    await collection.insertOne({
      userId,
      action,
      timestamp: new Date(),
      details,
      ipAddress,
      userAgent,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<UserAuditLog[]> {
  try {
    const collection = await getCollection<UserAuditLog>("user_audit_logs");
    const logs = await collection
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    return logs;
  } catch (error) {
    console.error("Error fetching user audit logs:", error);
    return [];
  }
}

/**
 * Notifications - Store notification history
 */
export async function logNotification(
  data: NotificationLog
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const collection = await getCollection<NotificationLog>("notifications");
    const result = await collection.insertOne({
      ...data,
      sentAt: new Date(),
    });
    return { success: true, id: result.insertedId.toString() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<NotificationLog[]> {
  try {
    const collection = await getCollection<NotificationLog>("notifications");
    const query: any = { userId };
    if (unreadOnly) query.readAt = { $exists: false };

    const notifications = await collection
      .find(query)
      .sort({ sentAt: -1 })
      .toArray();
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCollection<NotificationLog>("notifications");
    await collection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { readAt: new Date() } }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create MongoDB Indexes for performance
 */
export async function createMongoDBIndexes(): Promise<void> {
  try {
    // Product Images
    const productImagesCollection = await getCollection<ProductImage>(
      "product_images"
    );
    await productImagesCollection.createIndex({ productId: 1 });

    // User Documents
    const userDocumentsCollection = await getCollection<UserDocument>(
      "user_documents"
    );
    await userDocumentsCollection.createIndex({ userId: 1 });
    await userDocumentsCollection.createIndex({
      expiresAt: 1,
      expireAfterSeconds: 0,
    }); // TTL index

    // Order Archives
    const orderArchivesCollection = await getCollection<OrderArchive>(
      "order_archives"
    );
    await orderArchivesCollection.createIndex({ userId: 1 });
    await orderArchivesCollection.createIndex({ orderId: 1 });

    // Delivery Analytics
    const deliveryAnalyticsCollection = await getCollection<DeliveryAnalytics>(
      "delivery_analytics"
    );
    await deliveryAnalyticsCollection.createIndex({ deliveryPartnerId: 1 });
    await deliveryAnalyticsCollection.createIndex({ date: 1 });

    // User Audit Logs
    const auditLogsCollection = await getCollection<UserAuditLog>(
      "user_audit_logs"
    );
    await auditLogsCollection.createIndex({ userId: 1 });
    await auditLogsCollection.createIndex({ timestamp: 1 });

    // Notifications
    const notificationsCollection = await getCollection<NotificationLog>(
      "notifications"
    );
    await notificationsCollection.createIndex({ userId: 1 });
    await notificationsCollection.createIndex({ sentAt: 1 });

    console.log("✅ MongoDB indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
}
