import { useEffect, useRef, useState } from 'react';
import { useTutorial } from '@/contexts/tutorial-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TutorialOverlay() {
  const { isActive, currentStep, steps, nextStep, previousStep, skipTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const updateTargetPosition = () => {
      const target = document.querySelector(steps[currentStep].target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    // Initial position
    updateTargetPosition();

    // Update on scroll or resize
    window.addEventListener('scroll', updateTargetPosition);
    window.addEventListener('resize', updateTargetPosition);

    // Observe DOM changes
    const observer = new MutationObserver(updateTargetPosition);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', updateTargetPosition);
      window.removeEventListener('resize', updateTargetPosition);
      observer.disconnect();
    };
  }, [isActive, currentStep, steps]);

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const placement = step.placement || 'bottom';

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) return {};

    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipHeight) / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipHeight) / 2;
        left = targetRect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    if (top < padding) top = padding;
    if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9999,
    };
  };

  // Highlight style for target element
  const getHighlightStyle = () => {
    if (!targetRect) return {};

    return {
      position: 'fixed' as const,
      top: `${targetRect.top - 4}px`,
      left: `${targetRect.left - 4}px`,
      width: `${targetRect.width + 8}px`,
      height: `${targetRect.height + 8}px`,
      border: '3px solid',
      borderColor: 'var(--sea-green)',
      borderRadius: '8px',
      pointerEvents: 'none' as const,
      zIndex: 9998,
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
    };
  };

  return (
    <>
      {/* Dark overlay with highlight cutout */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9997]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={skipTutorial}
      />

      {/* Highlight box */}
      {targetRect && <div style={getHighlightStyle()} />}

      {/* Tutorial tooltip */}
      <Card style={getTooltipStyle()} className="shadow-xl border-sea-green">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-oxford-blue">{step.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipTutorial}
              className="h-6 w-6 text-charcoal hover:text-oxford-blue"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-charcoal mb-4">{step.content}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-sea-green' : 'bg-silver'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousStep}
                  className="text-charcoal border-silver"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-sea-green text-mint-cream hover:bg-sea-green/90"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}