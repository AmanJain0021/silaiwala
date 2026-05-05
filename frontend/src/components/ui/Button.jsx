import React from 'react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

    const variants = {
        primary: 'bg-[#2D2F6E] text-white hover:bg-black shadow-sm', // Deep Pink & High Contrast Black
        secondary: 'bg-indigo-50 text-[#2D2F6E] hover:bg-indigo-100',
        outline: 'border border-[#2D2F6E]/20 bg-background hover:bg-indigo-50 hover:text-[#2D2F6E]',
        ghost: 'hover:bg-indigo-50 hover:text-[#2D2F6E]',
        link: 'text-[#2D2F6E] underline-offset-4 hover:underline',
    };

    const sizes = {
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
    };

    return (
        <button
            ref={ref}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export { Button };
