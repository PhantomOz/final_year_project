import PropTypes from "prop-types";
import { forwardRef } from "react";

const Input = forwardRef(
  (
    { label, error, className = "", type = "text", required = false, ...props },
    ref
  ) => {
    const baseClasses =
      "block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const errorClasses = error ? "border-red-300" : "border-gray-300";

    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            className={`${baseClasses} ${errorClasses}`}
            required={required}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  type: PropTypes.string,
  required: PropTypes.bool,
};

Input.displayName = "Input";

export default Input;
