import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

const buttonStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '14px',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  background: '#fff',
  color: '#1f2937',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  textAlign: 'left',
  transition: 'border-color 0.2s',
};

const dropdownMenuStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 50,
  width: '100%',
  marginTop: '4px',
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  maxHeight: '240px',
  overflowY: 'auto',
};

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div style={{ marginBottom: label ? '16px' : 0 }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '6px',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            ...buttonStyle,
            background: disabled ? '#f3f4f6' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderColor: isOpen ? '#4f46e5' : '#d1d5db',
          }}
        >
          <span style={{ color: selectedOption ? '#1f2937' : '#9ca3af' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {isOpen ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
        </button>

        {isOpen && !disabled && (
          <div style={dropdownMenuStyle}>
            {options.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#6b7280', fontSize: '14px' }}>
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '14px',
                    background: option.value === value ? '#f3f4f6' : 'white',
                    fontWeight: option.value === value ? '600' : '400',
                    color: '#1f2937',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (option.value !== value) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = option.value === value ? '#f3f4f6' : 'white';
                  }}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
