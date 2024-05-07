import truncate from 'lodash/truncate';

export default function AdName({ adName }: { adName: string | null | undefined }): React.ReactElement | null {
  if (!adName) return null;

  return (
    <div className="flex flex-row">
      <svg
        width="24px"
        height="24px"
        viewBox="0 0 24 24"
        className="stroke-[rgb(var(--foreground-rgb))]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5Z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 15V11C7 9.89543 7.89543 9 9 9V9C10.1046 9 11 9.89543 11 11V15"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M17 9V15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 12H15.5C13.5 12 13.5 15 15.5 15H17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 13H11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>{truncate(adName, { length: 20 })}</div>
    </div>
  );
}
