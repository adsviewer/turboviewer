'use client';
import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import SectionHeader from '../Common/section-header';

function Integration(): ReactNode {
  const t = useTranslations('integrations');
  return (
    <section id="integration" className="pt-20 lg:pt-25 xl:pt-30">
      <div className="mx-auto max-w-c-1390 px-4 md:px-8 2xl:px-0">
        {/* <!-- Section Title Start --> */}
        <SectionHeader
          headerInfo={{
            title: t('title'),
            subtitle: t('subtitle'),
            description: t('description'),
          }}
        />

        {/* <!-- Section Title End --> */}
      </div>

      <div className="pattern-dots pattern-blue-500 pattern-bg-white pattern-size-4 pattern-opacity-10 relative z-50 mx-auto mt-15 max-w-c-1154 px-4 md:px-8 xl:mt-20 xl:px-0">
        <div className="absolute -top-3/4 left-0 right-0 -z-1 mx-auto h-full w-full">
          <Image
            width={1200}
            height={400}
            sizes="(max-width: 768px) 100vw"
            src="/images/shape/shape-dotted-light.svg"
            alt="Dotted"
            className="dark:hidden"
            style={{ position: 'static' }}
          />
          <Image fill src="/images/shape/shape-dotted-dark.svg" alt="Dotted" className="hidden dark:block" />
        </div>

        {/* Brands container row 1 */}
        <div className="flex flex-wrap justify-evenly items-center mb-12 gap-y-10">
          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="inline-block rounded-[10px] bg-white p-4.5 shadow-solid-7 dark:bg-btndark">
              <Image width={50} height={50} src="./images/brand/brand-facebook.svg" alt="Brand" />
            </div>
          </motion.div>

          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="h-[6px] w-[6px] rounded-full bg-[#EF5C00]" />
          </motion.div>
          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="inline-block rounded-[10px] bg-white p-4.5 shadow-solid-7 dark:bg-btndark">
              <Image width={50} height={50} src="./images/brand/brand-instagram.svg" alt="Brand" />
            </div>
          </motion.div>

          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="inline-block rounded-[10px] bg-white p-4.5 shadow-solid-7 dark:bg-btndark">
              <Image width={50} height={50} src="./images/brand/brand-tiktok.svg" alt="Brand" />
            </div>
          </motion.div>
          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="h-[11px] w-[11px] rounded-full bg-[#FFDB26]" />
          </motion.div>
          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="inline-block rounded-[10px] bg-white p-4.5 shadow-solid-7 dark:bg-btndark">
              <Image width={50} height={50} src="./images/brand/brand-snapchat.svg" alt="Brand" />
            </div>
          </motion.div>
          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="h-[7px] w-[7px] opacity-35 rounded-full bg-primary" />
          </motion.div>
        </div>

        {/* Brands container row 2 */}
        <div className="flex flex-wrap justify-evenly items-center">
          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="inline-block rounded-[10px] bg-white p-4.5 shadow-solid-7 dark:bg-btndark">
              <Image
                width={50}
                height={50}
                src="./images/brand/brand-youtube.svg"
                alt="Brand"
                style={{ width: '50px', height: 'auto' }}
              />
            </div>
          </motion.div>

          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="h-[9px] w-[9px] opacity-50 rounded-full bg-primary" />
          </motion.div>

          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="inline-block rounded-[10px] bg-white p-4.5 shadow-solid-7 dark:bg-btndark">
              <Image width={50} height={50} src="./images/brand/brand-linkedIn.svg" alt="Brand" />
            </div>
          </motion.div>

          <motion.div
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
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-1/7 flex justify-center items-center"
          >
            <div className="inline-block rounded-[10px] bg-white p-4.5 shadow-solid-7 dark:bg-btndark">
              <Image width={50} height={50} src="./images/brand/brand-google-ads.svg" alt="Brand" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Integration;
