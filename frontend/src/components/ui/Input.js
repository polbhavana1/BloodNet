import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Input = React.forwardRef(({ 
  className, 
  type = "text", 
  placeholder, 
  label, 
  error, 
  icon, 
  showPasswordToggle = false,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={inputType}
          className={cn(
            "w-full px-4 py-3 rounded-2xl border transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
            "placeholder:text-gray-400",
            icon && "pl-10",
            showPasswordToggle && "pr-12",
            error ? "border-red-500 bg-red-50" : "border-gray-200",
            isFocused && !error && "border-red-300 shadow-sm",
            className
          )}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        
        {showPasswordToggle && type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

export const Select = React.forwardRef(({ 
  className, 
  label, 
  error, 
  children, 
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <motion.select
        ref={ref}
        className={cn(
          "w-full px-4 py-3 rounded-2xl border transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
          "appearance-none bg-white",
          error ? "border-red-500 bg-red-50" : "border-gray-200",
          className
        )}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.select>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

export const TextArea = React.forwardRef(({ 
  className, 
  label, 
  error, 
  rows = 3, 
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <motion.textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full px-4 py-3 rounded-2xl border transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
          "resize-none",
          error ? "border-red-500 bg-red-50" : "border-gray-200",
          className
        )}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        {...props}
      />
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

export default Input; 
