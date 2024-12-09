import { z } from 'zod';

const addressSchema = z.object({
  city: z.string().nullable(),
  country: z.string().nullable(),
  line1: z.string().nullable(),
  line2: z.string().nullable(),
  postal_code: z.string().nullable(),
  state: z.string().nullable(),
});

const customerDetailsSchema = z.object({
  address: addressSchema,
  email: z.string().nullable(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  tax_exempt: z.string().nullable(),
  tax_ids: z.array(z.unknown()).nullable(),
});

const automaticTaxSchema = z.object({
  enabled: z.boolean(),
  liability: z.unknown().nullable(),
  status: z.unknown().nullable(),
});

const customTextSchema = z.object({
  after_submit: z.unknown().nullable(),
  shipping_address: z.unknown().nullable(),
  submit: z.unknown().nullable(),
  terms_of_service_acceptance: z.unknown().nullable(),
});

const paymentMethodOptionsSchema = z.object({
  card: z
    .object({
      request_three_d_secure: z.string().nullable(),
    })
    .nullable(),
});

const totalDetailsSchema = z.object({
  amount_discount: z.number(),
  amount_shipping: z.number(),
  amount_tax: z.number(),
});

const dataObjectSchema = z.object({
  id: z.string(),
  object: z.string(),
  adaptive_pricing: z.unknown().nullable(),
  after_expiration: z.unknown().nullable(),
  allow_promotion_codes: z.unknown().nullable(),
  amount_subtotal: z.number(),
  amount_total: z.number(),
  automatic_tax: automaticTaxSchema,
  billing_address_collection: z.unknown().nullable(),
  cancel_url: z.string().nullable(),
  client_reference_id: z.unknown().nullable(),
  client_secret: z.unknown().nullable(),
  consent: z.unknown().nullable(),
  consent_collection: z.unknown().nullable(),
  created: z.number(),
  currency: z.string(),
  currency_conversion: z.unknown().nullable(),
  custom_fields: z.array(z.unknown()).nullable(),
  custom_text: customTextSchema,
  customer: z.string().nullable(),
  customer_creation: z.string().nullable(),
  customer_details: customerDetailsSchema,
  customer_email: z.unknown().nullable(),
  expires_at: z.number().nullable(),
  invoice: z.string().nullable(),
  invoice_creation: z.unknown().nullable(),
  livemode: z.boolean(),
  locale: z.unknown().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  mode: z.string().nullable(),
  payment_intent: z.unknown().nullable(),
  payment_link: z.unknown().nullable(),
  payment_method_collection: z.string().nullable(),
  payment_method_configuration_details: z
    .object({
      id: z.string().nullable(),
      parent: z.unknown().nullable(),
    })
    .nullable(),
  payment_method_options: paymentMethodOptionsSchema,
  payment_method_types: z.array(z.string()).nullable(),
  payment_status: z.string().nullable(),
  phone_number_collection: z
    .object({
      enabled: z.boolean(),
    })
    .nullable(),
  recovered_from: z.unknown().nullable(),
  saved_payment_method_options: z
    .object({
      allow_redisplay_filters: z.array(z.string()).nullable(),
      payment_method_remove: z.unknown().nullable(),
      payment_method_save: z.unknown().nullable(),
    })
    .nullable(),
  setup_intent: z.unknown().nullable(),
  shipping_address_collection: z.unknown().nullable(),
  shipping_cost: z.unknown().nullable(),
  shipping_details: z.unknown().nullable(),
  shipping_options: z.array(z.unknown()).nullable(),
  status: z.string().nullable(),
  submit_type: z.unknown().nullable(),
  subscription: z.string().nullable(),
  success_url: z.string().nullable(),
  total_details: totalDetailsSchema,
  ui_mode: z.string().nullable(),
  url: z.unknown().nullable(),
});

const detailSchema = z.object({
  id: z.string(),
  object: z.string(),
  api_version: z.string(),
  created: z.number(),
  data: z.object({
    object: dataObjectSchema,
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.object({
    id: z.unknown().nullable(),
    idempotency_key: z.unknown().nullable(),
  }),
  type: z.string(),
});

export const stripeWebhookSchema = z.object({
  version: z.string(),
  id: z.string(),
  'detail-type': z.string(),
  source: z.string(),
  account: z.string(),
  time: z.string(),
  region: z.string(),
  resources: z.array(z.string()),
  detail: detailSchema,
});
