import Image from 'next/image';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { type Testimonial } from '@/types/testimonial';

function SingleTestimonial({ review }: { review: Testimonial }): ReactNode {
  const { name, image } = review;
  const t = useTranslations('testimonial');
  return (
    <div className="rounded-lg bg-white p-9 pt-7.5 shadow-solid-9 dark:border dark:border-strokedark dark:bg-blacksection dark:shadow-none">
      <div className="mb-7.5 flex justify-between border-b border-stroke pb-6 dark:border-strokedark">
        <div>
          <h3 className="mb-1.5 text-metatitle3 text-black dark:text-white">{t(`${name}.name`)}</h3>
          <p>{t(`${name}.designation`)}</p>
        </div>
        <Image width={0} height={0} style={{ width: '60', height: 'auto' }} className="" src={image} alt={name} />
      </div>

      <p>{t(`${name}.content`)}</p>
    </div>
  );
}

export default SingleTestimonial;
