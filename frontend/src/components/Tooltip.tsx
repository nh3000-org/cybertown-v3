import React from 'react';
import * as RTooltip from '@radix-ui/react-tooltip';

type Props = {
  children: React.ReactNode
  title: string
}

export const Tooltip = React.forwardRef((props: Props, _ref) => {
  const { children, title, ...others } = props
  return (
    <RTooltip.Provider>
      <RTooltip.Root>
        <RTooltip.Trigger {...others}>
          {children}
        </RTooltip.Trigger >
        <RTooltip.Portal>
          <RTooltip.Content>
            <p className="rounded-lg p-1 px-3 shadow-md bg-bg-2 text-fg-2 border border-border">{title}</p>
            <RTooltip.Arrow className="fill-accent" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  )
})
