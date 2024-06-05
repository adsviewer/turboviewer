import { Flex, Loader } from '@mantine/core';

interface LoaderProps {
  type?: 'bars' | 'dots' | 'oval';
}
export default function LoaderCentered(props: LoaderProps): React.ReactNode {
  return (
    <Flex justify="center" align="center" w="100%" h="100%">
      <Loader type={props.type ?? 'oval'} />
    </Flex>
  );
}
