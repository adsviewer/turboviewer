import { Flex, Loader } from '@mantine/core';

export default function LoaderCentered(): React.ReactNode {
  return (
    <Flex justify="center" align="center" w="100%" h="100%">
      <Loader />
    </Flex>
  );
}
