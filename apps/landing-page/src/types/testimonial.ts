import { type StaticImport } from 'next/dist/shared/lib/get-img-props';

export interface Testimonial {
  id: number;
  name: string;
  destination?: string;
  image: string | StaticImport;
}
