import { z } from 'zod';
import { AError } from '@repo/utils';
import { logger } from '@repo/logger';
import { parse as htmlParse } from 'node-html-parser';

export enum IFrameScrolling {
  Auto = 'auto',
  Yes = 'yes',
  No = 'no',
}
const iFrameSchema = z.object({
  title: z.string().optional(),
  src: z.string(),
  width: z.coerce.number().int().positive(),
  height: z.coerce.number().int().positive(),
  scrolling: z.nativeEnum(IFrameScrolling).optional(),
});

export type ChannelIFrame = z.infer<typeof iFrameSchema>;

export const getIFrame = (iFrame: string): AError | ChannelIFrame => {
  const htmlRoot = htmlParse(iFrame);
  const attributes = htmlRoot.querySelector('iframe')?.attributes;
  const iFrameData = iFrameSchema.safeParse(attributes);
  if (!iFrameData.success) {
    logger.error(iFrameData.error, 'Invalid iFrame data');
    return new AError('Invalid iFrame data');
  }
  return iFrameData.data;
};
