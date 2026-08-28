import React from 'react';

interface StepperProps {
  steps: string[];
  currentStepIndex: number;
  activeStepIndex?: number;
  onStepClick?: (index: number) => void;
}

export default function Stepper({ steps, currentStepIndex, activeStepIndex, onStepClick }: StepperProps) {
  const activeIndex = activeStepIndex !== undefined ? activeStepIndex : currentStepIndex;

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {steps.map((label, i) => {
        const done = i < currentStepIndex;
        const current = i === currentStepIndex;
        const active = i === activeIndex;
        const isLast = i === steps.length - 1;
        const clickable = onStepClick && (done || current);

        const circleBg = done && !active ? '#2f6f4f' : active ? '#d9704f' : '#fff';
        const circleColor = (done || active) ? '#fff' : '#9a917d';
        const circleBorder = done && !active ? '#2f6f4f' : active ? '#d9704f' : '#dcd7cb';
        const textColor = active ? '#13243c' : '#5a5e66';
        const connectorColor = done ? '#2f6f4f' : '#dcd7cb';

        const BubbleWrapper = clickable ? 'button' : 'div';
        const bubbleProps = clickable ? { onClick: () => onStepClick(i), type: 'button' as const } : {};

        return (
          <div key={i} className="flex items-center" style={{ flex: isLast ? 0 : 1 }}>
            <div className={`flex items-center gap-2 ${clickable ? 'cursor-pointer group' : ''}`}>
              <BubbleWrapper
                {...bubbleProps}
                className="w-[30px] h-[30px] shrink-0 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#d9704f] focus:ring-offset-2"
                style={{ background: circleBg, color: circleColor, border: `2px solid ${circleBorder}` }}
              >
                {done && !active ? '✓' : i + 1}
              </BubbleWrapper>
              <span className={`hidden lg:inline text-[13px] font-semibold whitespace-nowrap transition-colors duration-300 ${clickable ? 'group-hover:text-[#d9704f]' : ''}`} style={{ color: textColor }}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className="h-[2px] flex-1 mx-2 lg:mx-4 min-w-[20px] transition-colors duration-300" style={{ background: connectorColor }}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
