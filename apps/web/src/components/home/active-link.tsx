'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@repo/ui/tailwind-utils';

export interface LinkType {
  url: string;
  text: string;
  exact?: boolean;
  icon?: React.ReactNode;
  isChild?: boolean;
  sublinks?: LinkType[];
}

const areChildrenActive = (pathname: string, sublinks: LinkType[]): boolean => {
  return sublinks.some((link) => {
    if (link.url === pathname) {
      return true;
    }
    if (link.sublinks) {
      return areChildrenActive(pathname, link.sublinks);
    }
    return false;
  });
};

export function ActiveLink({ url, text, icon, isChild, exact, sublinks }: LinkType): React.ReactElement | null {
  const pathname = usePathname();

  let active = false;
  if (url === '/') {
    if (pathname === url) {
      active = true;
    }
  } else if (exact && pathname === url) {
    active = true;
  } else if (!exact && pathname.startsWith(url)) {
    active = true;
  }

  if (sublinks) {
    active = areChildrenActive(pathname, sublinks);
  }

  const children = sublinks ? (
    <ul className="ml-4">
      {sublinks.map((child) => (
        <ActiveLink key={child.url} {...child} isChild />
      ))}
    </ul>
  ) : null;

  if (isChild) {
    return (
      <li className={cx('ml-4 my-2 flex')}>
        {active ? <div className="inline min-h-full rounded-lg w-[3px] bg-white mr-2" /> : null}
        <Link
          title={text}
          href={url}
          className={cx(
            'flex items-center gap-2 text-md font-semibold  transition-all w-full',
            'text-menu-tertiary hover:text-menu-tertiary/90',
            active && 'text-white',
          )}
        >
          {text}
        </Link>
        {children}
      </li>
    );
  }

  return (
    <li>
      <Link
        title={text}
        href={url}
        className={cx(
          'flex items-center gap-2 text-md font-semibold',
          'hover:text-menu-primary/90',
          active && 'text-menu-primary',
          'transition-all',
        )}
      >
        <span className={cx(active ? 'text-menu-primary' : 'text-menu-tertiary')}>{icon}</span>
        {text}
      </Link>
      {children}
    </li>
  );
}
