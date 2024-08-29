'use client';
import Image from 'next/image';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeader from '../Common/section-header';

function Pricing(): ReactNode {
  const t = useTranslations('pricing');
  return (
    <>
      <section className="overflow-hidden pb-20 pt-15 lg:pb-25 xl:pb-30">
        <div className="mx-auto max-w-c-1315 px-4 md:px-8 xl:px-0">
          <div className="animate_top mx-auto text-center">
            <SectionHeader
              headerInfo={{
                title: t('title'),
                subtitle: t('subtitle'),
                description: t('description'),
              }}
            />
          </div>
        </div>

        <div className="relative mx-auto mt-15 max-w-[1207px] px-4 md:px-8 xl:mt-20 xl:px-0">
          <div className="absolute -bottom-15 -z-1 h-full w-full">
            <Image fill src="./images/shape/shape-dotted-light.svg" alt="Dotted" className="dark:hidden" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-7.5 xl:gap-12.5">

            {/* Pricing Intro */}
            <div className="animate_top group relative rounded-lg border border-stroke bg-white p-7.5 shadow-solid-10 dark:border-strokedark dark:bg-blacksection dark:shadow-none h-full flex flex-col">
              <h3 className="mb-7.5 text-3xl font-bold text-black dark:text-white xl:text-sectiontitle2">
                Tier:
              </h3>
              <h4 className="mb-2.5 text-para2 font-medium text-black dark:text-white">Price</h4>
              <div className="mt-36 border-t border-stroke pb-12.5 pt-9 dark:border-strokedark">
                <ul>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">User(s)</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">Integrations</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">Data Recency</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">AI Analysis</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">SSO</li>
                </ul>
              </div>
            </div>

            {/* Pricing Item */}
            <div className="animate_top group relative rounded-lg border border-stroke bg-white p-7.5 shadow-solid-10 dark:border-strokedark dark:bg-blacksection dark:shadow-none h-full flex flex-col">
              <h3 className="mb-7.5 text-3xl font-bold text-black dark:text-white xl:text-sectiontitle2">
              {t('tier1-packname')}
              </h3>
              <h4 className="mb-2.5 text-para2 font-medium text-black dark:text-white">Free</h4>
              <p className="flex-grow">{t('tier1-packdescription')}</p>
              <div className="mt-9 border-t border-stroke pb-12.5 pt-9 dark:border-strokedark">
                <ul>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier1-users')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier1-integrations')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier1-data')}</li>
                  <li className="mb-4 text-black opacity-40 last:mb-0 dark:text-manatee">{t('tier1-ai')}</li>
                  <li className="mb-4 text-black opacity-40 last:mb-0 dark:text-manatee">{t('tier1-sso')}</li>
                </ul>
              </div>

              <button
                type="button"
                aria-label={`${t('getThePlan')} button`}
                className="group/btn inline-flex items-center gap-2.5 font-medium text-primary transition-all duration-300 dark:text-white dark:hover:text-primary mt-auto"
              >
                <span className="duration-300 group-hover/btn:pr-2">{t('getThePlan')}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.4767 6.16701L6.00668 1.69701L7.18501 0.518677L13.6667 7.00034L7.18501 13.482L6.00668 12.3037L10.4767 7.83368H0.333344V6.16701H10.4767Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            {/* Pricing Item */}
            <div className="animate_top group relative rounded-lg border border-stroke bg-white p-7.5 shadow-solid-10 dark:border-strokedark dark:bg-blacksection dark:shadow-none h-full flex flex-col">
              <h3 className="mb-7.5 text-3xl font-bold text-black dark:text-white xl:text-sectiontitle2">
              {t('tier2-packname')}
              </h3>
              <h4 className="mb-2.5 text-para2 font-medium text-black dark:text-white">${t('tier2-price')} <span className="text-regular text-waterloo dark:text-manatee">/{t('month')}</span></h4>
              <p className="flex-grow">{t('tier2-packdescription')}</p>
              <div className="mt-9 border-t border-stroke pb-12.5 pt-9 dark:border-strokedark">
                <ul>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier2-users')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier2-integrations')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier2-data')}</li>
                  <li className="mb-4 text-black  last:mb-0 dark:text-manatee">{t('tier2-ai')}</li>
                  <li className="mb-4 text-black opacity-40 last:mb-0 dark:text-manatee">{t('tier2-sso')}</li>
                </ul>
              </div>

              <button
                type="button"
                aria-label={`${t('getThePlan')} button`}
                className="group/btn inline-flex items-center gap-2.5 font-medium text-primary transition-all duration-300 dark:text-white dark:hover:text-primary mt-auto"
              >
                <span className="duration-300 group-hover/btn:pr-2">{t('getThePlan')}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.4767 6.16701L6.00668 1.69701L7.18501 0.518677L13.6667 7.00034L7.18501 13.482L6.00668 12.3037L10.4767 7.83368H0.333344V6.16701H10.4767Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            {/* Pricing Item */}
            <div className="animate_top group relative rounded-lg border border-stroke bg-white p-7.5 shadow-solid-10 dark:border-strokedark dark:bg-blacksection dark:shadow-none h-full flex flex-col">
              <h3 className="mb-7.5 text-3xl font-bold text-black dark:text-white xl:text-sectiontitle2">
              {t('tier3-packname')}
              </h3>
              <h4 className="mb-2.5 text-para2 font-medium text-black dark:text-white">${t('tier3-price')} <span className="text-regular text-waterloo dark:text-manatee">/{t('user')}</span></h4>
              <p className="flex-grow">{t('tier3-packdescription')}</p>
              <div className="mt-9 border-t border-stroke pb-12.5 pt-9 dark:border-strokedark">
                <ul>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier3-users')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier3-integrations')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier3-data')}</li>
                  <li className="mb-4 text-black  last:mb-0 dark:text-manatee">{t('tier3-ai')}</li>
                  <li className="mb-4 text-black opacity-40 last:mb-0 dark:text-manatee">{t('tier3-sso')}</li>
                </ul>
              </div>

              <button
                type="button"
                aria-label={`${t('getThePlan')} button`}
                className="group/btn inline-flex items-center gap-2.5 font-medium text-primary transition-all duration-300 dark:text-white dark:hover:text-primary mt-auto"
              >
                <span className="duration-300 group-hover/btn:pr-2">{t('getThePlan')}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.4767 6.16701L6.00668 1.69701L7.18501 0.518677L13.6667 7.00034L7.18501 13.482L6.00668 12.3037L10.4767 7.83368H0.333344V6.16701H10.4767Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            {/* Pricing Item */}
            <div className="animate_top group relative rounded-lg border border-stroke bg-white p-7.5 shadow-solid-10 dark:border-strokedark dark:bg-blacksection dark:shadow-none h-full flex flex-col">
              <h3 className="mb-7.5 text-3xl font-bold text-black dark:text-white xl:text-sectiontitle2">
              {t('tier4-packname')}
              </h3>
              <h4 className="mb-2.5 text-para2 font-medium text-black dark:text-white">{t('tier4-price')}</h4>
              <p className="flex-grow">{t('tier4-packdescription')}</p>
              <div className="mt-9 border-t border-stroke pb-12.5 pt-9 dark:border-strokedark">
                <ul>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier4-users')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier4-integrations')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier4-data')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier4-ai')}</li>
                  <li className="mb-4 text-black last:mb-0 dark:text-manatee">{t('tier4-sso')}</li>
                </ul>
              </div>

              <button
                type="button"
                aria-label={`${t('contactUspricing')} button`}
                className="group/btn inline-flex items-center gap-2.5 font-medium text-primary transition-all duration-300 dark:text-white dark:hover:text-primary mt-auto"
              >
                <span className="duration-300 group-hover/btn:pr-2">{t('contactUspricing')}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.4767 6.16701L6.00668 1.69701L7.18501 0.518677L13.6667 7.00034L7.18501 13.482L6.00668 12.3037L10.4767 7.83368H0.333344V6.16701H10.4767Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Pricing;
