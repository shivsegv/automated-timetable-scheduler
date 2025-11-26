import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
  Stack,
  Button,
  Alert,
  Collapse,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import timetableService from '../services/api';

function SolverConfig({ onConfigChange }) {
  const [config, setConfig] = useState({
    terminationMinutes: 5,
    terminationSeconds: 0,
    bestScoreLimit: null,
    unimprovedSecondsLimit: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadConfiguration = useCallback(async () => {
    try {
      const response = await timetableService.getSolverConfig();
      setConfig(response.data);
      if (onConfigChange) {
        onConfigChange(response.data);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }, [onConfigChange]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const handleChange = (field, value) => {
    const newConfig = {
      ...config,
      [field]: value === '' ? null : (field === 'terminationMinutes' || field === 'terminationSeconds' ? parseInt(value, 10) : Number(value) || value),
    };
    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await timetableService.updateSolverConfig(config);
      setMessage({ type: 'success', text: 'Configuration saved successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultConfig = {
      terminationMinutes: 5,
      terminationSeconds: 0,
      bestScoreLimit: null,
      unimprovedSecondsLimit: null,
    };
    setConfig(defaultConfig);
    if (onConfigChange) {
      onConfigChange(defaultConfig);
    }
  };

  const getTotalSeconds = () => (config.terminationMinutes * 60) + config.terminationSeconds;

  return (
    <Box sx={{ p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={2}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Solver window
          </Typography>
          <Typography variant="h6">Runtime & stability controls</Typography>
        </Box>
        <Button variant="text" onClick={() => setShowAdvanced((prev) => !prev)}>
          {showAdvanced ? 'Hide advanced limits' : 'Show advanced limits'}
        </Button>
      </Stack>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Maximum Minutes"
            type="number"
            fullWidth
            value={config.terminationMinutes}
            onChange={(e) => handleChange('terminationMinutes', e.target.value)}
            helperText="Primary limit for solver runtime"
            inputProps={{ min: 1, max: 60 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Additional Seconds"
            type="number"
            fullWidth
            value={config.terminationSeconds}
            onChange={(e) => handleChange('terminationSeconds', e.target.value)}
            helperText="Fine tune the cut-off"
            inputProps={{ min: 0, max: 59 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Chip
            label={`Total runtime: ${Math.floor(getTotalSeconds() / 60)}m ${getTotalSeconds() % 60}s`}
            variant="outlined"
          />
        </Grid>
      </Grid>

      <Collapse in={showAdvanced} timeout={300} unmountOnExit>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Best Score Limit"
              type="number"
              fullWidth
              value={config.bestScoreLimit ?? ''}
              onChange={(e) => handleChange('bestScoreLimit', e.target.value)}
              helperText="Stop when this score is reached"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Unimproved Seconds Limit"
              type="number"
              fullWidth
              value={config.unimprovedSecondsLimit ?? ''}
              onChange={(e) => handleChange('unimprovedSecondsLimit', e.target.value)}
              helperText="Abort if no improvement within the window"
            />
          </Grid>
        </Grid>
      </Collapse>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mt={4}>
        <Button variant="outlined" onClick={handleReset} disabled={loading}>
          Reset defaults
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : 'Save configuration'}
        </Button>
      </Stack>
    </Box>
  );
}

export default SolverConfig;
