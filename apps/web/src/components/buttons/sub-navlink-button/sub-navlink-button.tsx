import Link from 'next/link';
import React from 'react';
import { Flex } from '@mantine/core';
import classes from './sub-navlink-button.module.scss';

interface PropsType {
  label: string;
  href: string;
  isActive: boolean;
}

export default function SubNavlinkButton(props: PropsType): React.ReactNode {
  return (
    <Flex
      href={props.href}
      component={Link}
      align="center"
      className={props.isActive ? classes.linkActive : classes.link}
      data-active={props.isActive}
      my={1}
    >
      <Flex>{props.label}</Flex>
    </Flex>
  );
}
