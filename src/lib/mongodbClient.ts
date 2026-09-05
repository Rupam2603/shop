/**
 * MongoDB Client Helper
 * Easy-to-use wrapper for calling MongoDB API endpoints from React components
 */

export interface MongoDBResponse<T = any> {
  success: boolean;
  data?: T;
  id?: string;
  error?: string;
  message?: string;
  images?: T[];
  documents?: T[];
  analytics?: T[];
}

/**
 * Call MongoDB API endpoint
 */
export async function fetchMongoData<T = any>(
  action: string,
  payload: Record<string, any>
): Promise<MongoDBResponse<T>> {
  try {
    const response = await fetch("/api/mongodb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        ...payload,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error(`MongoDB API error (${action}):`, error);
    return {
      success: false,
      error: error.message || "Network error",
    };
  }
}

/**
 * Save product images to MongoDB
 */
export async function saveProductImages(
  productId: string,
  imageUrl: string,
  galleryImages: string[] = [],
  webImageUrl: string = imageUrl
): Promise<MongoDBResponse> {
  return fetchMongoData("save_product_image", {
    productId,
    imageUrl,
    galleryImages,
    webImageUrl,
    uploadedBy: "system",
  });
}

/**
 * Get product images from MongoDB
 */
export async function getProductImages(
  productId: string
): Promise<MongoDBResponse> {
  return fetchMongoData("get_product_images", { productId });
}

/**
 * Save user document (prescription, invoice, etc.)
 */
export async function saveUserDocument(
  userId: string,
  documentType: "prescription" | "invoice" | "receipt" | "agreement" | "other",
  documentUrl: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  metadata?: Record<string, any>
): Promise<MongoDBResponse> {
  return fetchMongoData("save_user_document", {
    userId,
    documentType,
    documentUrl,
    fileName,
    fileSize,
    mimeType,
    metadata,
  });
}

/**
 * Get user documents from MongoDB
 */
export async function getUserDocuments(
  userId: string,
  documentType?: string
): Promise<MongoDBResponse> {
  return fetchMongoData("get_user_documents", {
    userId,
    documentType,
  });
}

/**
 * Archive an order to MongoDB
 */
export async function archiveOrder(
  orderId: string,
  userId: string,
  orderData: Record<string, any>,
  reason: string = "automatic_archive"
): Promise<MongoDBResponse> {
  return fetchMongoData("archive_order", {
    orderId,
    userId,
    orderData,
    reason,
  });
}

/**
 * Save delivery partner analytics
 */
export async function saveDeliveryAnalytics(
  deliveryPartnerId: string,
  ordersCompleted: number,
  totalDistance: number,
  averageDeliveryTime: number,
  ratings: number[] = [],
  earnings: number = 0
): Promise<MongoDBResponse> {
  return fetchMongoData("save_delivery_analytics", {
    deliveryPartnerId,
    ordersCompleted,
    totalDistance,
    averageDeliveryTime,
    ratings,
    earnings,
  });
}

/**
 * Get delivery partner analytics
 */
export async function getDeliveryAnalytics(
  deliveryPartnerId: string,
  days: number = 30
): Promise<MongoDBResponse> {
  return fetchMongoData("get_delivery_analytics", {
    deliveryPartnerId,
    days,
  });
}

/**
 * Log user action for audit trail
 */
export async function logUserAction(
  userId: string,
  action: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<MongoDBResponse> {
  return fetchMongoData("log_user_action", {
    userId,
    action,
    details,
    ipAddress,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });
}

/**
 * Log notification
 */
export async function logNotification(
  userId: string,
  type: "email" | "sms" | "push" | "in_app",
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<MongoDBResponse> {
  return fetchMongoData("log_notification", {
    userId,
    type,
    title,
    message,
    metadata,
  });
}

// Export for use in components
export default {
  fetchMongoData,
  saveProductImages,
  getProductImages,
  saveUserDocument,
  getUserDocuments,
  archiveOrder,
  saveDeliveryAnalytics,
  getDeliveryAnalytics,
  logUserAction,
  logNotification,
};
