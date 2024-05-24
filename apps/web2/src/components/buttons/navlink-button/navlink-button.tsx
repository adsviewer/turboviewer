import Link from 'next/link';
import React from 'react';
import { Flex } from '@mantine/core';
import classes from './navlink-button.module.scss';

interface PropsType {
  iconNode: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

export default function NavlinkButton(props: PropsType): React.ReactNode {
  return (
    <Flex
      href={props.href}
      component={Link}
      align="center"
      className={props.isActive ? classes.linkActive : classes.link}
      data-active={props.isActive}
      my={1}
    >
      <Flex mr={10}>{props.iconNode}</Flex>
      <Flex>{props.label}</Flex>
    </Flex>
  );
}
