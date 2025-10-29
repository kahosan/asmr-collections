import { ThemeProvider } from './theme';
import { Toaster } from '~/components/ui/sonner';
import { TooltipProvider } from '~/components/ui/tooltip';

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster position="top-right" />
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}
