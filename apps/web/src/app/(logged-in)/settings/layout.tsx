import { type JSX } from 'react';

export default function SettingsLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between gap-4 border-b-2 border-gray-100 p-6">
        <div className="text-4xl font-bold">Settings</div>
      </div>
      <div className="px-6 py-8 mb-6">{children}</div>
    </div>
  );
}
