export function Logo(props: React.ComponentProps<'svg'>): React.ReactElement | null {
  return (
    <svg
      className="stroke-[rgb(var(--foreground-rgb))] fill-[rgb(var(--foreground-rgb))]"
      width={200}
      height={26}
      viewBox="0 0 200 26"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line x1="9.19527" y1="2.28171" x2="1.28172" y2="24.024" strokeWidth="2" strokeLinecap="round" />
      <line
        x1="1"
        y1="-1"
        x2="24.1377"
        y2="-1"
        transform="matrix(0.34202 0.939693 0.939693 -0.34202 10 1)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="-1"
        x2="24.1377"
        y2="-1"
        transform="matrix(-0.34202 -0.939693 -0.939693 0.34202 36.6715 25)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="37.4023" y1="23.7183" x2="45.3159" y2="1.97601" strokeWidth="2" strokeLinecap="round" />
      <line
        x1="1"
        y1="-1"
        x2="24.1377"
        y2="-1"
        transform="matrix(0.34202 0.939693 0.939693 -0.34202 20.1827 1)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
