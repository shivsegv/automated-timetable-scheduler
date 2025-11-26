import React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

/**
 * Reusable Toast notification component
 * Addresses issues: #97 (toast notifications), #4 (success/error feedback)
 */
function Toast({ open, onClose, severity = 'info', message, title, autoHideDuration = 6000 }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          borderRadius: 2
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
}

export default Toast;
