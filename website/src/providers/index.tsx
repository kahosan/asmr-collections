import { ThemeProvider } from './theme';

import { Toaster } from '~/components/ui/sonner';
import { TooltipProvider } from '~/components/ui/tooltip';

import { AnimatePresence } from 'framer-motion';

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster position="top-right" />
      <AnimatePresence>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </AnimatePresence>
    </ThemeProvider>
  );
}
