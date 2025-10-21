import { ThemeProvider } from './theme';

import { Toaster } from '~/components/ui/sonner';
import { TooltipProvider } from '~/components/ui/tooltip';

import { AnimatePresence } from 'framer-motion';

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <>
      <Toaster position="top-right" />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AnimatePresence>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AnimatePresence>
      </ThemeProvider>
    </>
  );
}
