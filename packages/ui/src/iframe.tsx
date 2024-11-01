interface FrameData {
  width: number;
  height: number;
  src: string;
}

interface PropsType {
  data: FrameData;
  setIsLoadingIframe: (isLoading: boolean) => void;
}

export default function IFrameComponent(props: PropsType): React.ReactNode {
  return (
    <iframe
      title="IFrame"
      scrolling="no"
      loading="lazy"
      style={{ border: 'none' }}
      width={props.data.width}
      height={props.data.height}
      src={props.data.src}
      onLoad={() => {
        props.setIsLoadingIframe(false);
      }}
    />
  );
}

// const IFrame = React.forwardRef<HTMLIFrameElement, React.IframeHTMLAttributes<HTMLIFrameElement>>(
//   ({ className, ...props }, ref) => {
//     return <iframe title={props.src} className={cn('', className)} ref={ref} {...props} />;
//   },
// );
// IFrame.displayName = 'IFrame';
