import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AddRounded,
  DeleteOutlineRounded,
  ArrowForwardRounded,
  InfoOutlined,
  DateRangeRounded,
  SchoolRounded,
  ClassRounded
} from '@mui/icons-material';
import timetableService from '../services/api';

function BatchYearMapping() {
  const theme = useTheme();
  const [mappings, setMappings] = useState({});
  const [newIdentifier, setNewIdentifier] = useState('');
  const [newYearLevel, setNewYearLevel] = useState('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    loadMappings();
    loadBatches();
  }, []);

  const loadMappings = async () => {
    try {
      const response = await timetableService.getBatchYearMapping();
      setMappings(response.data.yearIdentifierToLevel || {});
    } catch (error) {
      console.error('Error loading batch-year mappings:', error);
      setMessage({
        type: 'error',
        text: `Error loading mappings: ${error.message}`,
      });
    }
  };

  const loadBatches = async () => {
    try {
      const response = await timetableService.getBatches();
      setBatches(response.data);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const handleAddMapping = async (e) => {
    e.preventDefault();
    if (!newIdentifier.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter a year identifier (e.g., 2024)',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await timetableService.addBatchYearMapping(newIdentifier, parseInt(newYearLevel));
      await loadMappings();
      setNewIdentifier('');
      setNewYearLevel('1');
      setMessage({
        type: 'success',
        text: `Added mapping: ${newIdentifier} → Year ${newYearLevel}.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMapping = async (identifier) => {
    if (!window.confirm(`Remove mapping for "${identifier}"?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await timetableService.removeBatchYearMapping(identifier);
      await loadMappings();
      setMessage({
        type: 'success',
        text: `Removed mapping for ${identifier}.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getYearLevelName = (level) => {
    const names = { 1: 'First Year', 2: 'Second Year', 3: 'Third Year', 4: 'Fourth Year' };
    return names[level] || `Year ${level}`;
  };

  const getBatchesForIdentifier = (identifier) => {
    return batches.filter((batch) => batch.batchName.includes(identifier));
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'background.paper',
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: 'divider',
        borderWidth: 1,
      },
      '&:hover fieldset': {
        borderColor: 'text.primary',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
        borderWidth: 2,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'primary.main',
      fontWeight: 600
    }
  };

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Batch Mapping
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '48ch', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Configure which batch year identifiers map to which year levels. Update this each academic year.
          </Typography>
        </Stack>
        <Paper 
          elevation={0}
          sx={{ 
            px: 2.5, 
            py: 1.5, 
            borderRadius: 4, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
            <ClassRounded />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" letterSpacing="0.05em">
              Active Mappings
            </Typography>
            <Typography variant="h5" fontWeight={800} lineHeight={1}>
              {Object.keys(mappings).length}
            </Typography>
          </Box>
        </Paper>
      </Stack>

      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 0, 
                borderRadius: 4, 
                border: '1px solid', 
                borderColor: 'divider',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                <Typography variant="h6" fontWeight={700}>Current Mappings</Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                {Object.keys(mappings).length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <Box sx={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: '50%', 
                      bgcolor: 'action.hover', 
                      display: 'grid', 
                      placeItems: 'center', 
                      mx: 'auto', 
                      mb: 2 
                    }}>
                      <ClassRounded sx={{ fontSize: 32, color: 'text.secondary' }} />
                    </Box>
                    <Typography color="text.secondary" fontWeight={500}>
                      No mappings configured. Add your first mapping to get started.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {Object.entries(mappings)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([identifier, level]) => {
                        const affectedBatches = getBatchesForIdentifier(identifier);
                        return (
                          <Grid item xs={12} key={identifier}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                borderRadius: 3, 
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.2s', 
                                '&:hover': { 
                                  borderColor: 'primary.main', 
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                                } 
                              }}
                            >
                              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                                  <Stack direction="row" alignItems="center" spacing={3}>
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                        IDENTIFIER
                                      </Typography>
                                      <Typography variant="h5" fontWeight={800} sx={{ color: 'primary.main' }}>
                                        {identifier}
                                      </Typography>
                                    </Box>
                                    
                                    <ArrowForwardRounded color="action" sx={{ opacity: 0.5 }} />
                                    
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                        MAPPED TO
                                      </Typography>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip 
                                          label={`Year ${level}`} 
                                          size="small"
                                          sx={{ 
                                            fontWeight: 700, 
                                            borderRadius: 1.5,
                                            bgcolor: level === 1 ? alpha(theme.palette.success.main, 0.1) : 
                                                    level === 4 ? alpha(theme.palette.warning.main, 0.1) : 
                                                    alpha(theme.palette.primary.main, 0.1),
                                            color: level === 1 ? 'success.main' : 
                                                   level === 4 ? 'warning.main' : 
                                                   'primary.main'
                                          }}
                                        />
                                        <Typography variant="body2" fontWeight={600}>
                                          {getYearLevelName(level)}
                                        </Typography>
                                      </Stack>
                                    </Box>
                                  </Stack>
                                  
                                  <Tooltip title="Remove Mapping">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveMapping(identifier)}
                                      sx={{ 
                                        color: 'text.disabled',
                                        '&:hover': { color: 'error.main', bgcolor: 'error.lighter' }
                                      }}
                                    >
                                      <DeleteOutlineRounded />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                                
                                {batches.length > 0 && (
                                  <Box mt={2.5} pt={2} borderTop="1px dashed" borderColor="divider">
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                                        Affected Batches:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {affectedBatches.length > 0 ? (
                                          affectedBatches.map((batch) => (
                                            <Chip 
                                              key={batch.id} 
                                              label={batch.batchName} 
                                              size="small" 
                                              variant="outlined" 
                                              sx={{ borderRadius: 1, height: 24, fontSize: '0.75rem', borderColor: 'divider' }} 
                                            />
                                          ))
                                        ) : (
                                          <Typography variant="caption" color="text.disabled" fontStyle="italic">
                                            No matching batches found
                                          </Typography>
                                        )}
                                      </Box>
                                    </Stack>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                  </Grid>
                )}
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }} elevation={0}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'info.lighter', color: 'info.main' }}>
                    <InfoOutlined fontSize="small" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700}>How it works</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                  The system uses year identifiers (like "2024", "2023") found in batch names to determine
                  which year level they belong to. This determines which time slots are used for scheduling.
                </Typography>
                <Grid container spacing={2} mt={1}>
                  {[
                    { year: 'Year 1', desc: 'First year students (e.g., CSE_A_2024)' },
                    { year: 'Year 2', desc: 'Second year students (e.g., CSE_A_2023)' },
                    { year: 'Year 3', desc: 'Third year students (e.g., CSE_A_2022)' },
                    { year: 'Year 4', desc: 'Fourth year students (e.g., CSE_A_2021)' }
                  ].map((item) => (
                    <Grid item xs={12} sm={6} key={item.year}>
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" fontWeight={700} display="block" gutterBottom color="primary.main">
                          {item.year}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 4, 
              border: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 24
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={700}>
                  Add New Mapping
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Define a new year identifier for incoming or existing batches.
                </Typography>
              </Box>
              
              <Stack component="form" onSubmit={handleAddMapping} spacing={2.5}>
                <TextField
                  label="Year Identifier"
                  placeholder="e.g., 2025"
                  value={newIdentifier}
                  onChange={(e) => setNewIdentifier(e.target.value)}
                  fullWidth
                  size="small"
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: <DateRangeRounded fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                
                <FormControl fullWidth size="small" sx={inputStyles}>
                  <InputLabel>Year Level</InputLabel>
                  <Select
                    value={newYearLevel}
                    label="Year Level"
                    onChange={(e) => setNewYearLevel(e.target.value)}
                  >
                    <MenuItem value="1">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SchoolRounded fontSize="small" color="success" />
                        <span>Year 1 (First Year)</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="2">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SchoolRounded fontSize="small" color="primary" />
                        <span>Year 2 (Second Year)</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="3">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SchoolRounded fontSize="small" color="primary" />
                        <span>Year 3 (Third Year)</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="4">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SchoolRounded fontSize="small" color="warning" />
                        <span>Year 4 (Fourth Year)</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={<AddRounded />}
                  sx={{ 
                    py: 1.2,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(59, 130, 246, 0.3)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  {loading ? 'Adding...' : 'Add Mapping'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default BatchYearMapping;
