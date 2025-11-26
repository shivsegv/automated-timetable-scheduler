import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { WarningAmberRounded, ErrorOutlineRounded } from '@mui/icons-material';

/**
 * Reusable confirmation dialog component
 * Addresses issues: #35 (no undo functionality), #52 (remove button needs confirmation)
 */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning', // 'warning' | 'error' | 'info'
  showAlert = false,
  alertMessage = ''
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <ErrorOutlineRounded sx={{ fontSize: 48, color: 'error.main' }} />;
      case 'warning':
      default:
        return <WarningAmberRounded sx={{ fontSize: 48, color: 'warning.main' }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          {getIcon()}
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary" mb={showAlert ? 2 : 0}>
          {message}
        </Typography>
        {showAlert && alertMessage && (
          <Alert severity={severity} sx={{ mt: 2 }}>
            {alertMessage}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={severity === 'error' ? 'error' : 'primary'}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
