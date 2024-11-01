interface FrameData {
  width: number;
  height: number;
  src: string;
}

interface PropsType {
  data: FrameData;
  setIsLoadingIframe: (isLoading: boolean) => void;
}

export default function EmbedComponent(props: PropsType): React.ReactNode {
  return (
    <object
      title="Embed"
      style={{ border: 'none' }}
      width={props.data.width}
      height={props.data.height}
      data={props.data.src}
      onLoad={() => {
        props.setIsLoadingIframe(false);
      }}
    />
  );
}
