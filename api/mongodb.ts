import { getCollection } from "../src/lib/mongodb";
import { createMongoDBIndexes } from "../src/lib/mongodbServices";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "https://shop-phi-plum.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Initialize indexes on first request
    await createMongoDBIndexes();

    if (req.method === "POST") {
      const { action, ...data } = req.body;

      switch (action) {
        case "save_product_image":
          return handleSaveProductImage(req, res, data);

        case "get_product_images":
          return handleGetProductImages(req, res, data);

        case "save_user_document":
          return handleSaveUserDocument(req, res, data);

        case "get_user_documents":
          return handleGetUserDocuments(req, res, data);

        case "archive_order":
          return handleArchiveOrder(req, res, data);

        case "save_delivery_analytics":
          return handleSaveDeliveryAnalytics(req, res, data);

        case "get_delivery_analytics":
          return handleGetDeliveryAnalytics(req, res, data);

        case "log_user_action":
          return handleLogUserAction(req, res, data);

        case "log_notification":
          return handleLogNotification(req, res, data);

        default:
          return res.status(400).json({ error: "Unknown action" });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("MongoDB API error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleSaveProductImage(req, res, data) {
  const { productId, imageUrl, galleryImages, webImageUrl } = data;

  const collection = await getCollection("product_images");
  const result = await collection.insertOne({
    productId,
    imageUrl,
    galleryImages: galleryImages || [],
    webImageUrl,
    thumbnailUrl: imageUrl, // Can be resized version
    uploadedAt: new Date(),
    uploadedBy: data.uploadedBy || "system",
  });

  return res.status(201).json({
    success: true,
    id: result.insertedId.toString(),
  });
}

async function handleGetProductImages(req, res, data) {
  const { productId } = data;
  const collection = await getCollection("product_images");
  const images = await collection.find({ productId }).toArray();

  return res.status(200).json({
    success: true,
    images: images.map((img) => ({
      ...img,
      _id: img._id.toString(),
    })),
  });
}

async function handleSaveUserDocument(req, res, data) {
  const { userId, documentType, documentUrl, fileName, fileSize, mimeType } =
    data;

  const collection = await getCollection("user_documents");
  const result = await collection.insertOne({
    userId,
    documentType,
    documentUrl,
    fileName,
    fileSize,
    mimeType,
    uploadedAt: new Date(),
    metadata: data.metadata || {},
  });

  return res.status(201).json({
    success: true,
    id: result.insertedId.toString(),
  });
}

async function handleGetUserDocuments(req, res, data) {
  const { userId, documentType } = data;
  const collection = await getCollection("user_documents");

  const query: any = { userId };
  if (documentType) query.documentType = documentType;

  const documents = await collection
    .find(query)
    .sort({ uploadedAt: -1 })
    .toArray();

  return res.status(200).json({
    success: true,
    documents: documents.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    })),
  });
}

async function handleArchiveOrder(req, res, data) {
  const { orderId, userId, orderData, reason } = data;

  const collection = await getCollection("order_archives");
  await collection.insertOne({
    orderId,
    userId,
    orderData,
    archivedAt: new Date(),
    reason: reason || "manual_archive",
  });

  return res.status(201).json({
    success: true,
    message: "Order archived successfully",
  });
}

async function handleSaveDeliveryAnalytics(req, res, data) {
  const {
    deliveryPartnerId,
    ordersCompleted,
    totalDistance,
    averageDeliveryTime,
    ratings,
    earnings,
  } = data;

  const collection = await getCollection("delivery_analytics");
  await collection.insertOne({
    deliveryPartnerId,
    date: new Date(),
    ordersCompleted,
    totalDistance,
    averageDeliveryTime,
    ratings: ratings || [],
    averageRating: ratings ? ratings.reduce((a, b) => a + b) / ratings.length : 0,
    earnings,
    metadata: data.metadata || {},
  });

  return res.status(201).json({
    success: true,
    message: "Delivery analytics saved",
  });
}

async function handleGetDeliveryAnalytics(req, res, data) {
  const { deliveryPartnerId, days } = data;
  const collection = await getCollection("delivery_analytics");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days || 30));

  const analytics = await collection
    .find({
      deliveryPartnerId,
      date: { $gte: startDate },
    })
    .sort({ date: -1 })
    .toArray();

  return res.status(200).json({
    success: true,
    analytics: analytics.map((a) => ({
      ...a,
      _id: a._id.toString(),
    })),
  });
}

async function handleLogUserAction(req, res, data) {
  const { userId, action, details, ipAddress, userAgent } = data;

  const collection = await getCollection("user_audit_logs");
  await collection.insertOne({
    userId,
    action,
    timestamp: new Date(),
    details: details || {},
    ipAddress,
    userAgent,
  });

  return res.status(201).json({
    success: true,
    message: "Action logged",
  });
}

async function handleLogNotification(req, res, data) {
  const { userId, type, title, message, metadata } = data;

  const collection = await getCollection("notifications");
  const result = await collection.insertOne({
    userId,
    type,
    title,
    message,
    sentAt: new Date(),
    metadata: metadata || {},
  });

  return res.status(201).json({
    success: true,
    id: result.insertedId.toString(),
  });
}
