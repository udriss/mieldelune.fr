/**
 * Global registry to ensure only one auto-scroll is registered per scrollable container
 */
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';

class AutoScrollRegistry {
  private registeredElements = new Set<Element>();
  private cleanupFunctions = new Map<Element, () => void>();

  /**
   * Register auto-scroll for an element if not already registered
   * @param element - The scrollable element
   * @returns cleanup function or null if already registered
   */
  registerAutoScroll(element: Element): (() => void) | null {
    // Check if already registered
    if (this.registeredElements.has(element)) {
      
      return null;
    }

    // Check if element is actually scrollable
    const computedStyle = window.getComputedStyle(element);
    const isScrollable = computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll';
    
    if (!isScrollable) {
      console.warn('Element is not scrollable, skipping auto-scroll setup:', element.className);
      return null;
    }

    

    // Register the element
    this.registeredElements.add(element);

    // Create auto-scroll
    const cleanup = autoScrollForElements({
      element,
      canScroll: ({ source }) => source.data.type === 'content-element',
      getAllowedAxis: () => 'vertical',
      getConfiguration: () => ({
        maxScrollSpeed: 'fast',
        damping: 0.5,
      }),
    });

    // Store cleanup function
    this.cleanupFunctions.set(element, cleanup);

    // Return a cleanup function that also unregisters
    return () => {
      this.unregisterAutoScroll(element);
    };
  }

  /**
   * Unregister auto-scroll for an element
   * @param element - The scrollable element
   */
  unregisterAutoScroll(element: Element): void {
    if (!this.registeredElements.has(element)) {
      return;
    }

    

    // Call cleanup function
    const cleanup = this.cleanupFunctions.get(element);
    if (cleanup) {
      cleanup();
      this.cleanupFunctions.delete(element);
    }

    // Remove from registry
    this.registeredElements.delete(element);
  }

  /**
   * Clean up all registered auto-scrolls
   */
  cleanupAll(): void {
    
    
    for (const [element, cleanup] of this.cleanupFunctions) {
      cleanup();
    }
    
    this.cleanupFunctions.clear();
    this.registeredElements.clear();
  }

  /**
   * Get debug info about registered elements
   */
  getDebugInfo(): { registeredCount: number; elements: string[] } {
    return {
      registeredCount: this.registeredElements.size,
      elements: Array.from(this.registeredElements).map(el => el.className || el.tagName)
    };
  }
}

// Export singleton instance
export const autoScrollRegistry = new AutoScrollRegistry();
