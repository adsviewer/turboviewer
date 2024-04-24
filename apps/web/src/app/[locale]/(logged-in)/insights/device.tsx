import { DeviceEnum } from '@/graphql/generated/schema-server';

export default function Device({ device }: { device: DeviceEnum | null | undefined }): React.ReactElement | null {
  if (!device) return null;

  switch (device) {
    case DeviceEnum.Desktop:
      return <WebBrowser />;
    case DeviceEnum.MobileApp:
      return <MobileApp />;
    case DeviceEnum.MobileWeb:
      return <MobileBrowser />;
    case DeviceEnum.Unknown:
    default:
      return null;
  }
}

function WebBrowser(_props: React.ComponentProps<'svg'>): React.ReactElement {
  return (
    <svg
      className="stroke-[rgb(var(--foreground-rgb))] fill-[rgb(var(--foreground-rgb))]"
      height="24px"
      width="24px"
      version="1.1"
      id="_x32_"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 512 512"
      xmlSpace="preserve"
    >
      <style type="text/css" />
      <g>
        <path
          className="st0"
          d="M464,0H48C21.492,0,0,21.492,0,48v416c0,26.508,21.492,48,48,48h416c26.507,0,48-21.492,48-48V48
		C512,21.492,490.507,0,464,0z M444.664,35c10.492,0,19,8.508,19,19s-8.508,19-19,19c-10.493,0-19-8.508-19-19
		S434.171,35,444.664,35z M374.164,35c10.492,0,19,8.508,19,19s-8.508,19-19,19c-10.493,0-19-8.508-19-19S363.671,35,374.164,35z
		 M303.664,35c10.492,0,19,8.508,19,19s-8.508,19-19,19c-10.493,0-19-8.508-19-19S293.171,35,303.664,35z M472,464
		c0,4.406-3.586,8-8,8H48c-4.414,0-8-3.594-8-8V104h432V464z"
        />
        <path
          className="st0"
          d="M97.484,328.656h16.031c0.977,0,1.625-0.633,1.93-1.562l13.774-44h0.336l13.43,44
		c0.328,0.93,0.985,1.562,1.946,1.562h16.187c0.985,0,1.633-0.633,1.938-1.562l25.117-72.656c0.313-0.93-0.187-1.562-1.304-1.562
		h-19.914c-1.149,0-1.789,0.484-2.102,1.562l-12.313,45.094h-0.312l-13.766-45.094c-0.336-1.078-0.977-1.562-2.11-1.562H122.75
		c-1.141,0-1.953,0.484-2.258,1.562l-13.454,45.094h-0.328l-12.945-45.094c-0.329-1.078-0.954-1.562-2.266-1.562H71.594
		c-0.992,0-1.454,0.633-1.157,1.562l25.118,72.656C95.874,328.023,96.523,328.656,97.484,328.656z"
        />
        <path
          className="st0"
          d="M224.086,328.656h16.054c0.962,0,1.618-0.633,1.93-1.562l13.766-44h0.328l13.43,44
		c0.336,0.93,0.984,1.562,1.953,1.562h16.18c0.984,0,1.625-0.633,1.953-1.562l25.102-72.656c0.313-0.93-0.172-1.562-1.297-1.562
		h-19.906c-1.156,0-1.805,0.484-2.117,1.562l-12.313,45.094h-0.32l-13.758-45.094c-0.336-1.078-0.977-1.562-2.102-1.562h-13.61
		c-1.133,0-1.946,0.484-2.258,1.562l-13.446,45.094h-0.32l-12.962-45.094c-0.312-1.078-0.969-1.562-2.258-1.562h-19.914
		c-0.993,0-1.469,0.633-1.133,1.562l25.094,72.656C222.484,328.023,223.133,328.656,224.086,328.656z"
        />
        <path
          className="st0"
          d="M350.882,328.656h16.047c0.953,0,1.602-0.633,1.922-1.562l13.766-44h0.336l13.43,44
		c0.328,0.93,0.969,1.562,1.938,1.562h16.195c0.977,0,1.625-0.633,1.946-1.562l25.117-72.656c0.297-0.93-0.187-1.562-1.297-1.562
		h-19.938c-1.133,0-1.781,0.484-2.094,1.562l-12.305,45.094h-0.32l-13.766-45.094c-0.336-1.078-0.977-1.562-2.102-1.562H376.14
		c-1.133,0-1.937,0.484-2.25,1.562l-13.461,45.094h-0.305l-12.954-45.094c-0.335-1.078-0.961-1.562-2.266-1.562h-19.922
		c-0.969,0-1.453,0.633-1.141,1.562l25.118,72.656C349.266,328.023,349.914,328.656,350.882,328.656z"
        />
      </g>
    </svg>
  );
}

function MobileBrowser(_props: React.ComponentProps<'svg'>): React.ReactElement {
  return (
    <svg
      className="stroke-[rgb(var(--foreground-rgb))] fill-[rgb(var(--foreground-rgb))]"
      width="24px"
      height="24px"
      viewBox="0 0 16 16"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <path
        fill="#444"
        d="M16 0h-13v5h-3v11h7v-3h9v-13zM6 1h9v1h-9v-1zM4 1h1v1h-1v-1zM4 15h-1v-1h1v1zM6 13h-5v-7h5v7zM15 12h-8v-7h-3v-2h11v9z"
      />
    </svg>
  );
}

function MobileApp(_props: React.ComponentProps<'svg'>): React.ReactElement {
  return (
    <svg
      className="stroke-[rgb(var(--foreground-rgb))]"
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 18H12.01M9.2 21H14.8C15.9201 21 16.4802 21 16.908 20.782C17.2843 20.5903 17.5903 20.2843 17.782 19.908C18 19.4802 18 18.9201 18 17.8V6.2C18 5.0799 18 4.51984 17.782 4.09202C17.5903 3.71569 17.2843 3.40973 16.908 3.21799C16.4802 3 15.9201 3 14.8 3H9.2C8.0799 3 7.51984 3 7.09202 3.21799C6.71569 3.40973 6.40973 3.71569 6.21799 4.09202C6 4.51984 6 5.07989 6 6.2V17.8C6 18.9201 6 19.4802 6.21799 19.908C6.40973 20.2843 6.71569 20.5903 7.09202 20.782C7.51984 21 8.07989 21 9.2 21Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
