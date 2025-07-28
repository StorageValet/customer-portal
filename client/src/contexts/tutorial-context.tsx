import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TutorialStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Optional action to perform when step is shown
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Tutorial steps configuration
  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      target: '.dashboard-header',
      title: 'Welcome to Storage Valet!',
      content: 'Let me show you around your storage dashboard. This is where you\'ll manage all your stored items.',
      placement: 'bottom'
    },
    {
      id: 'add-item',
      target: '[href="/inventory"]',
      title: 'Add Your First Item',
      content: 'Click here to add items to your storage inventory. You can upload photos and track everything you store.',
      placement: 'bottom'
    },
    {
      id: 'quick-actions',
      target: '.quick-actions-card',
      title: 'Quick Actions',
      content: 'Use these buttons to schedule pickups and request deliveries. They\'ll be enabled after your setup payment.',
      placement: 'top'
    },
    {
      id: 'stats',
      target: '.stats-cards',
      title: 'Your Storage Stats',
      content: 'Keep track of your items, total value, insurance coverage, and storage usage at a glance.',
      placement: 'bottom'
    },
    {
      id: 'recent-items',
      target: '.recent-items-card',
      title: 'Recent Items',
      content: 'Your recently added items appear here for quick access.',
      placement: 'top'
    },
    {
      id: 'navigation',
      target: 'nav',
      title: 'Navigation Menu',
      content: 'Access all features from the navigation bar. Explore inventory, appointments, analytics, and more!',
      placement: 'bottom'
    }
  ];

  // Check if user has seen tutorial
  useEffect(() => {
    if (user) {
      const tutorialKey = `tutorial_completed_${user.id}`;
      const completed = localStorage.getItem(tutorialKey);
      setHasSeenTutorial(!!completed);
      
      // Auto-start tutorial for new users who haven't seen it
      if (!completed && !user.setupFeePaid) {
        // Small delay to let the page render
        setTimeout(() => setIsActive(true), 1000);
      }
    }
  }, [user]);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    if (user) {
      localStorage.setItem(`tutorial_completed_${user.id}`, 'skipped');
    }
  };

  const completeTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    if (user) {
      localStorage.setItem(`tutorial_completed_${user.id}`, 'completed');
    }
  };

  const resetTutorial = () => {
    if (user) {
      localStorage.removeItem(`tutorial_completed_${user.id}`);
    }
    setHasSeenTutorial(false);
    setCurrentStep(0);
    startTutorial();
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        completeTutorial,
        resetTutorial
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}