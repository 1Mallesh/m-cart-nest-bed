export const KafkaTopics = {
  USER_CREATED: 'user.created',
  VENDOR_APPROVED: 'vendor.approved',
  PRODUCT_APPROVED: 'product.approved',
  ORDER_CREATED: 'order.created',
  ORDER_SHIPPED: 'order.shipped',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  DELIVERY_STARTED: 'delivery.started',
  DELIVERY_COMPLETED: 'delivery.completed',
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];
