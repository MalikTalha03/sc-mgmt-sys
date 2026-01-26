import type { InputHTMLAttributes, SelectHTMLAttributes, CSSProperties } from "react";

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '14px',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  background: '#fff',
  color: '#1f2937',
  transition: 'border-color 0.2s',
  outline: 'none',
};

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function FormInput({ 
  label, 
  error, 
  helperText, 
  style,
  ...props 
}: FormInputProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>
        {label}
        {props.required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </label>
      <input
        style={{
          ...inputStyle,
          borderColor: error ? '#dc2626' : '#d1d5db',
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#4f46e5';
          e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#dc2626' : '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{error}</p>}
      {helperText && !error && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{helperText}</p>}
    </div>
  );
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string | number; label: string }>;
}

export function FormSelect({ 
  label, 
  error, 
  helperText,
  options,
  style,
  ...props 
}: FormSelectProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>
        {label}
        {props.required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </label>
      <select
        style={{
          ...inputStyle,
          borderColor: error ? '#dc2626' : '#d1d5db',
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{error}</p>}
      {helperText && !error && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{helperText}</p>}
    </div>
  );
}
