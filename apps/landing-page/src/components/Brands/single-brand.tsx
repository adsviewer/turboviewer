import { type ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { type Brand } from '@/types/brand';

function SingleBrand({ brand }: { brand: Brand }): ReactNode {
  const { image, href, name, imageLight, id } = brand;

  return (
    <motion.a
      variants={{
        hidden: {
          opacity: 0,
          y: -20,
        },

        visible: {
          opacity: 1,
          y: 0,
        },
      }}
      initial="hidden"
      whileInView="visible"
      transition={{ duration: 1, delay: id }}
      viewport={{ once: true }}
      href={href}
      className="animate_top flex justify-center items-center mx-w-full relative w-full"
    >
      {/* Shows the first image element on light mode and the second on dark mode */}
      <Image
        className="opacity-65 transition-all duration-300 hover:opacity-100 dark:hidden"
        width={100}
        height={5}
        src={image}
        alt={name}
        style={{ width: '110px', height: 'auto' }} // exists to remove warnings
      />
      <Image
        className="hidden opacity-50 transition-all duration-300 hover:opacity-100 dark:block"
        width={100}
        height={5}
        src={imageLight}
        alt={name}
        style={{ width: '110px', height: 'auto' }} // exists to remove warnings
      />
    </motion.a>
  );
}

export default SingleBrand;
