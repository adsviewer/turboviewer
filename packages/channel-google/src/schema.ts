import { z, type ZodObject, type ZodTypeAny } from 'zod';

const createCommonResponseSchema = <T extends ZodTypeAny>(
  resultsSchema: T,
): ZodObject<{
  requestId: z.ZodOptional<z.ZodString>;
  queryResourceConsumption: z.ZodOptional<z.ZodString>;
  fieldMask: z.ZodOptional<z.ZodString>;
  results: z.ZodOptional<z.ZodArray<T>>;
}> => {
  return z.object({
    requestId: z.string().optional(),
    queryResourceConsumption: z.string().optional(),
    fieldMask: z.string().optional(),
    results: z.array(resultsSchema).optional(),
    next_page_token: z.string().optional(),
  });
};

const videoSchema = z.object({
  id: z.string(),
  durationMillis: z.string().optional(),
  title: z.string(),
});

const videoResponsiveAdSchema = z.object({
  descriptions: z
    .array(
      z.object({
        text: z.string(),
      }),
    )
    .optional(),
  callToActions: z
    .array(
      z.object({
        text: z.string(),
      }),
    )
    .optional(),
  videos: z.array(
    z.object({
      asset: z.string(),
    }),
  ),
});

const youtubeAdSchema = z.object({
  videoResponsiveAd: videoResponsiveAdSchema.optional(),
  id: z.string(),
});

const youtubeAdGroupAdSchema = z.object({
  resourceName: z.string(),
  status: z.string().optional(),
  ad: youtubeAdSchema,
});

const adGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const campaignSchema = z.object({
  name: z.string(),
  id: z.string(),
});

const metricsSchema = z.object({
  clicks: z.string(),
  impressions: z.string(),
  costMicros: z.string(),
});

const segmentsSchema = z.object({
  date: z.string(),
  device: z.string(),
});

export const videoAdResponseSchema = createCommonResponseSchema(
  z.object({
    video: videoSchema,
    adGroupAd: youtubeAdGroupAdSchema,
    adGroup: adGroupSchema,
    campaign: campaignSchema,
    metrics: metricsSchema,
    segments: segmentsSchema,
  }),
);

const customerClientSchema = z.object({
  resourceName: z.string().optional(),
  clientCustomer: z.string(),
  manager: z.boolean().optional(),
  descriptiveName: z.string().optional(),
});

export const defaultQueryResponseSchema = createCommonResponseSchema(
  z.object({
    customerClient: customerClientSchema,
  }),
);

const assetSchema = z.object({
  asset: z.object({
    id: z.string(),
    resourceName: z.string(),
    youtubeVideoAsset: z
      .object({
        youtubeVideoId: z.string(),
      })
      .optional(),
  }),
});

export const assetResponseSchema = createCommonResponseSchema(assetSchema);

const adSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  finalUrls: z.array(z.string()).optional(),
  responsiveSearchAd: z
    .object({
      headlines: z.array(z.object({ text: z.string() })).optional(),
      descriptions: z.array(z.object({ text: z.string() })).optional(),
    })
    .optional(),
  responsiveDisplayAd: z
    .object({
      marketingImages: z.array(z.object({ url: z.string() })).optional(),
      squareMarketingImages: z.array(z.object({ url: z.string() })).optional(),
    })
    .optional(),
  videoResponsiveAd: z
    .object({
      headlines: z.array(z.object({ text: z.string() })).optional(),
      descriptions: z.array(z.object({ text: z.string() })).optional(),
      videos: z.array(z.object({ asset: z.string() })).optional(),
    })
    .optional(),
});

const adGroupAdSchema = z.object({
  resourceName: z.string(),
  ad: adSchema,
});

export const responseSchema = createCommonResponseSchema(
  z.object({
    adGroupAd: adGroupAdSchema,
  }),
);

const customerSchema = z.object({
  resourceName: z.string(),
  id: z.string(),
  currencyCode: z.string(),
});

export const customerQueryResponseSchema = createCommonResponseSchema(
  z.object({
    customer: customerSchema,
  }),
);
