import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const buttonVariants = {
  primary: "bg-red-500 text-white hover:bg-red-600 shadow-red-200",
  secondary: "bg-teal-500 text-white hover:bg-teal-600 shadow-teal-200",
  outline: "border-2 border-red-500 text-red-500 hover:bg-red-50",
  ghost: "text-gray-600 hover:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-red-200",
  success: "bg-green-500 text-white hover:bg-green-600 shadow-green-200",
  warning: "bg-yellow-500 text-white hover:bg-yellow-600 shadow-yellow-200",
};

const buttonSizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-base",
  lg: "px-6 py-4 text-lg",
  xl: "px-8 py-5 text-xl",
};

const Button = React.forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  children, 
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  ...props 
}, ref) => {
  return (
    <motion.button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      transition={{ duration: 0.2 }}
      disabled={disabled || loading}
      onClick={props.onClick}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {icon && iconPosition === "left" && icon}
        {children}
        {icon && iconPosition === "right" && icon}
      </span>
    </motion.button>
  );
});

export const FloatingActionButton = ({ 
  className, 
  children, 
  onClick, 
  position = "bottom-right" 
}) => {
  const positionClasses = {
    "bottom-right": "fixed bottom-6 right-6",
    "bottom-left": "fixed bottom-6 left-6",
    "bottom-center": "fixed bottom-6 left-1/2 transform -translate-x-1/2",
  };

  return (
    <motion.button
      className={cn(
        "w-14 h-14 bg-red-500 text-white rounded-full shadow-lg",
        "hover:bg-red-600 hover:shadow-xl",
        "focus:outline-none focus:ring-4 focus:ring-red-200",
        "flex items-center justify-center",
        positionClasses[position],
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

export default Button;
