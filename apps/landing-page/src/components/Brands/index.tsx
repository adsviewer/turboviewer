'use client';
import React, { type ReactNode } from 'react';
import SingleBrand from './single-brand';
import brandData from './brand-data';

function Brands(): ReactNode {
  return (
    <>
      {/* <!-- ===== Clients Start ===== --> */}
      <section className="border border-x-0 border-y-stroke bg-alabaster py-9 dark:border-y-strokedark dark:bg-black">
        <div className="mx-auto max-w-c-1390 px-4 md:px-8 2xl:px-20">
          <div
            className={`grid grid-cols-${String(brandData.length)} sm:grid-cols-${String(brandData.length)} md:grid-cols-${String(brandData.length)} gap-7.5 lg:gap-12.5 xl:gap-1`}
          >
            {brandData.map((brand) => (
              <SingleBrand brand={brand} key={brand.id} />
            ))}
          </div>
        </div>
      </section>
      {/* <!-- ===== Clients End ===== --> */}
    </>
  );
}

export default Brands;
