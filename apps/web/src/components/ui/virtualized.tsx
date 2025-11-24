"use client";

import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { Primitive } from "@radix-ui/react-primitive";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import * as React from "react";
import { experimental_VGrid as VGrid, VList, Virtualizer } from "virtua";

import { ScrollBar } from "./scroll-area";

import { cn } from "~/lib/utils"

const VirtualizedContext = React.createContext<{
  scrollRef: React.RefObject<React.ComponentRef<typeof Primitive.div> | null>;
  withScrollRef: boolean;
}>({
  scrollRef: { current: null },
  withScrollRef: false,
});

function useVirtualized() {
  const context = React.useContext(VirtualizedContext);
  if (!context) {
    throw new Error("useVirtualized must be used within a <Virtualized />.");
  }
  return context;
}

function Virtualized({
  ref,
  ...props
}: React.ComponentProps<typeof Primitive.div>) {
  const scrollRef =
    React.useRef<React.ComponentRef<typeof Primitive.div>>(null);

  const composedRefs = useComposedRefs(scrollRef, ref);

  return (
    <VirtualizedContext.Provider value={{ scrollRef, withScrollRef: true }}>
      <Primitive.div data-slot="virtualized" ref={composedRefs} {...props} />
    </VirtualizedContext.Provider>
  );
}

export interface VirtualizedListProps
  extends Omit<React.ComponentProps<typeof VList>, "horizontal"> {
  orientation?: "vertical" | "horizontal";
}

function VirtualizedList({
  orientation = "vertical",
  ...props
}: VirtualizedListProps) {
  const { withScrollRef } = useVirtualized();

  if (withScrollRef) {
    throw new Error(
      "<VirtualizedList /> must not be used within a <Virtualized />.",
    );
  }

  return (
    <VList
      data-slot="virtualized-list"
      horizontal={orientation === "horizontal"}
      {...props}
    />
  );
}

function VirtualizedGrid(props: React.ComponentProps<typeof VGrid>) {
  return <VGrid data-slot="virtualized-grid" {...props} />;
}

type ScrollAreaProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  overscrollBehavior?: "auto" | "contain" | "none"
}

function VirtualizerScrollArea({
  className,
  children,
  overscrollBehavior,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <Virtualized asChild>
        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
          style={{
            overscrollBehavior: overscrollBehavior,
          }}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
      </Virtualized>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function VirtualizedVirtualizer({
  ...props
}: Omit<React.ComponentProps<typeof Virtualizer>, "scrollRef">) {
  const { scrollRef, withScrollRef } = useVirtualized();

  return (
    <Virtualizer
      data-slot="virtualized-virtualizer"
      scrollRef={withScrollRef ? scrollRef : undefined}
      {...props}
    />
  );
}

export {
  Virtualized,
  VirtualizedList,
  VirtualizedGrid,
  VirtualizerScrollArea,
  VirtualizedVirtualizer,
};