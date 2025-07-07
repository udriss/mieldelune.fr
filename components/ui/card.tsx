import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  defaultExpanded?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, defaultExpanded = true, children, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-card text-card-foreground shadow-sm',
          className
        )}
        {...props}
      >
        {title && (
          <div
            className="flex justify-between items-center p-3 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h2 className="text-xl font-semibold">{title}</h2>
            <span>{isExpanded ? 
              <ChevronDown className="h-5 w-5 transition-transform" /> : 
              <ChevronRight className="h-5 w-5 transition-transform" />
            }</span>
          </div>
        )}
        {(!title || isExpanded) && children}
      </div>
    )
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-3 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
