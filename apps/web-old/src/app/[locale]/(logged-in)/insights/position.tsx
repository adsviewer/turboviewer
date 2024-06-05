'use client';
import { Scan } from 'lucide-react';
import * as changeCase from 'change-case';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function Position({
  position,
  tooltipPosition,
}: {
  position: string | null | undefined;
  tooltipPosition: string;
}): React.ReactElement | null {
  if (!position) return null;

  return (
    <div className="flex flex-row">
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Scan />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="bottom"
              className="select-none rounded bg-tooltip-bg px-4 py-2 text-xs text-tooltip shadow-sm"
              sideOffset={5}
            >
              {tooltipPosition}
              <Tooltip.Arrow className="TooltipArrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      <div>{changeCase.sentenceCase(position)}</div>
    </div>
  );
}
