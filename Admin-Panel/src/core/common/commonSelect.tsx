import React, { useEffect, useState } from "react";
import Select from "react-select";

/**
 * Enhanced Select Component
 * @author haythem
 * @description A reusable select component that supports onChange events for filtering
 * @date March 2025
 */

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  defaultValue?: Option;
  className?: string;
  styles?: any;
  onChange?: (option: Option | null) => void;
}

const CommonSelect: React.FC<SelectProps> = ({ options, defaultValue, className, onChange }) => {
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(defaultValue);

  const handleChange = (option: Option | null) => {
    setSelectedOption(option || undefined);
    if (onChange) {
      onChange(option);
    }
  };
  
  useEffect(() => {
    setSelectedOption(defaultValue || undefined);
  }, [defaultValue])
  
  return (
    <Select
     classNamePrefix="react-select"
      className={className}
      // styles={customStyles}
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder="Select"
    />
  );
};

export default CommonSelect;
