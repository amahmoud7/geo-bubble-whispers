import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StackScreen {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  title?: string;
  headerOptions?: {
    transparent?: boolean;
    large?: boolean;
    leftButton?: 'back' | 'close' | 'none';
    rightButton?: React.ReactNode;
  };
}

interface StackContextType {
  push: (screen: StackScreen) => void;
  pop: () => void;
  replace: (screen: StackScreen) => void;
  canGoBack: boolean;
  currentScreen?: StackScreen;
}

const StackContext = createContext<StackContextType | null>(null);

export const useStack = () => {
  const context = useContext(StackContext);
  if (!context) {
    throw new Error('useStack must be used within a StackNavigator');
  }
  return context;
};

interface StackNavigatorProps {
  initialScreen: StackScreen;
  children?: React.ReactNode;
  className?: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const StackNavigator: React.FC<StackNavigatorProps> = ({
  initialScreen,
  children,
  className
}) => {
  const [stack, setStack] = useState<StackScreen[]>([initialScreen]);
  const [direction, setDirection] = useState(0);

  const push = useCallback((screen: StackScreen) => {
    setDirection(1);
    setStack(prev => [...prev, screen]);
  }, []);

  const pop = useCallback(() => {
    if (stack.length > 1) {
      setDirection(-1);
      setStack(prev => prev.slice(0, -1));
    }
  }, [stack.length]);

  const replace = useCallback((screen: StackScreen) => {
    setDirection(1);
    setStack(prev => [...prev.slice(0, -1), screen]);
  }, []);

  const canGoBack = stack.length > 1;
  const currentScreen = stack[stack.length - 1];

  const contextValue: StackContextType = {
    push,
    pop,
    replace,
    canGoBack,
    currentScreen
  };

  return (
    <StackContext.Provider value={contextValue}>
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentScreen.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="absolute inset-0 w-full h-full"
          >
            <currentScreen.component {...(currentScreen.props || {})} />
          </motion.div>
        </AnimatePresence>
        {children}
      </div>
    </StackContext.Provider>
  );
};

export default StackNavigator;