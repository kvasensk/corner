import React from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  success?: boolean;
}

export default function IconButton({
  icon,
  success,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={success ? styles.buttonSuccess : styles.button}
      type='button'
      {...props}
    >
      {icon}
    </button>
  );
}
