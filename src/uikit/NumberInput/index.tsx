import React from 'react';
import styles from './NumberInput.module.css';

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function NumberInput({
  value,
  onChange,
  ...props
}: NumberInputProps) {
  return (
    <input
      type='number'
      className={styles.input}
      value={value}
      onChange={e => onChange(e.target.value.replace(/^0+(?=\d)/, ''))}
      {...props}
    />
  );
}
