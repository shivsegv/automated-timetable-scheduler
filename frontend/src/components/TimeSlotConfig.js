import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Chip,
  Paper,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  DeleteOutlineRounded,
  AddRounded,
  SaveRounded,
  AccessTimeRounded,
  InfoOutlined,
  MoreTimeRounded,
  SchoolRounded,
  BookRounded
} from '@mui/icons-material';
import timetableService from '../services/api';
import Toast from './Toast';

function TimeSlotConfig() {
  const theme = useTheme();
  const [config, setConfig] = useState({
    year1Slots: [],
    year2Slots: [],
    year3Slots: [],
    year4Slots: [],
    minorSlots: [],
  });
  const [activeYear, setActiveYear] = useState('year1');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'info', message: '' });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await timetableService.getTimeSlotConfig();
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading time slot configuration:', error);
      setToast({
        open: true,
        severity: 'error',
        message: `Error loading configuration: ${error.message}`,
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await timetableService.updateTimeSlotConfig(config);
      setToast({
        open: true,
        severity: 'success',
        message: 'Time slot configuration saved successfully.',
      });
    } catch (error) {
      setToast({
        open: true,
        severity: 'error',
        message: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset to default time slots? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await timetableService.resetTimeSlotConfig();
      setConfig(response.data.config);
      setToast({
        open: true,
        severity: 'success',
        message: 'Configuration reset to defaults.',
      });
    } catch (error) {
      setToast({
        open: true,
        severity: 'error',
        message: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = () => {
    const yearKey = activeYear + 'Slots';
    const newSlot = {
      startTime: '09:00',
      endTime: '10:30',
      slotType: activeYear === 'minor' ? 'MINOR' : 'LECTURE',
    };
    setConfig({
      ...config,
      [yearKey]: [...config[yearKey], newSlot],
    });
  };

  const deleteTimeSlot = (index) => {
    const yearKey = activeYear + 'Slots';
    const updatedSlots = config[yearKey].filter((_, i) => i !== index);
    setConfig({
      ...config,
      [yearKey]: updatedSlots,
    });
  };

  const updateTimeSlot = (index, field, value) => {
    const yearKey = activeYear + 'Slots';
    const updatedSlots = [...config[yearKey]];
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value,
    };
    setConfig({
      ...config,
      [yearKey]: updatedSlots,
    });
  };

  const getActiveSlots = () => {
    return config[activeYear + 'Slots'] || [];
  };

  const getYearLabel = (year) => {
    const labels = {
      year1: 'Year 1 (2024 Batch)',
      year2: 'Year 2 (2023 Batch)',
      year3: 'Year 3 (2022 Batch)',
      year4: 'Year 4 (2021 Batch)',
      minor: 'Minor Courses',
    };
    return labels[year] || year;
  };

  const getTotalSlots = () => {
    return (
      config.year1Slots.length +
      config.year2Slots.length +
      config.year3Slots.length +
      config.year4Slots.length +
      config.minorSlots.length
    );
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
        borderColor: 'text.secondary',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
        borderWidth: 2,
      },
      // Removed the box-shadow that caused the "cheap" glow
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'primary.main',
      fontWeight: 600
    }
  };

  return (
    <Stack spacing={4}>
      {/* Header Section */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Time Slots
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '48ch', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Configure the daily schedule structure for each academic year. Define lecture and lab durations.
          </Typography>
        </Stack>
        <Paper 
          elevation={0}
          sx={{ 
            px: 2.5, 
            py: 1.5, 
            borderRadius: 3, 
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
            <AccessTimeRounded />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" letterSpacing="0.05em">
              Total Active Slots
            </Typography>
            <Typography variant="h5" fontWeight={800} lineHeight={1}>
              {getTotalSlots()}
            </Typography>
          </Box>
        </Paper>
      </Stack>

      {/* Main Content */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'visible' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: '12px 12px 0 0' }}>
          <ToggleButtonGroup
            value={activeYear}
            exclusive
            onChange={(_, val) => val && setActiveYear(val)}
            sx={{ 
              bgcolor: 'background.default', 
              p: 0.5, 
              borderRadius: 2,
              width: 'fit-content',
              display: 'flex',
              flexWrap: 'wrap',
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.secondary',
                px: 2,
                py: 0.75,
                mr: 0.5,
                '&:last-child': { mr: 0 },
                '&.Mui-selected': {
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                },
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.02)'
                }
              }
            }}
          >
            {['year1', 'year2', 'year3', 'year4', 'minor'].map((year) => (
              <ToggleButton key={year} value={year}>
                {year === 'minor' ? <BookRounded fontSize="small" sx={{ mr: 1 }} /> : <SchoolRounded fontSize="small" sx={{ mr: 1 }} />}
                {getYearLabel(year)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        
        <CardContent sx={{ p: 0, bgcolor: 'background.paper', borderRadius: '0 0 12px 12px' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h6" fontWeight={700} sx={{ px: 1 }}>
                {getYearLabel(activeYear)}
              </Typography>
              <Chip 
                label={`${getActiveSlots().length} Slots`} 
                size="small" 
                sx={{ 
                  fontWeight: 700, 
                  bgcolor: alpha(theme.palette.primary.main, 0.1), 
                  color: 'primary.main',
                  borderRadius: 1.5
                }} 
              />
            </Stack>
            <Button 
              variant="contained" 
              startIcon={<AddRounded />} 
              onClick={addTimeSlot}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 600,
                px: 3,
                boxShadow: 'none',
                '&:hover': { 
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Add Slot
            </Button>
          </Box>

          {getActiveSlots().length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 8, 
                textAlign: 'center', 
                bgcolor: 'transparent'
              }}
            >
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: alpha(theme.palette.primary.main, 0.05), 
                display: 'grid', 
                placeItems: 'center', 
                mx: 'auto', 
                mb: 3,
                color: 'primary.main'
              }}>
                <MoreTimeRounded sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No time slots configured
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={4} maxWidth={400} mx="auto">
                Start by adding the first time slot for {getYearLabel(activeYear).toLowerCase()}. 
                Define start and end times for lectures or labs.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={addTimeSlot} 
                startIcon={<AddRounded />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Create First Slot
              </Button>
            </Paper>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      py: 2,
                      fontWeight: 700, 
                      color: 'text.secondary', 
                      bgcolor: 'background.paper', 
                      borderBottom: '2px solid', 
                      borderColor: 'divider',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem'
                    }}>
                      Sequence
                    </TableCell>
                    <TableCell sx={{ 
                      py: 2,
                      fontWeight: 700, 
                      color: 'text.secondary', 
                      bgcolor: 'background.paper', 
                      borderBottom: '2px solid', 
                      borderColor: 'divider',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem'
                    }}>
                      Start Time
                    </TableCell>
                    <TableCell sx={{ 
                      py: 2,
                      fontWeight: 700, 
                      color: 'text.secondary', 
                      bgcolor: 'background.paper', 
                      borderBottom: '2px solid', 
                      borderColor: 'divider',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem'
                    }}>
                      End Time
                    </TableCell>
                    <TableCell sx={{ 
                      py: 2,
                      fontWeight: 700, 
                      color: 'text.secondary', 
                      bgcolor: 'background.paper', 
                      borderBottom: '2px solid', 
                      borderColor: 'divider',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem'
                    }}>
                      Session Type
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      py: 2,
                      fontWeight: 700, 
                      color: 'text.secondary', 
                      bgcolor: 'background.paper', 
                      borderBottom: '2px solid', 
                      borderColor: 'divider',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getActiveSlots().map((slot, index) => (
                    <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' }}>
                        #{index + 1}
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                          size="small"
                          sx={{ 
                            ...inputStyles, 
                            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } 
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                          size="small"
                          sx={{ 
                            ...inputStyles, 
                            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } 
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={slot.slotType}
                          onChange={(e) => updateTimeSlot(index, 'slotType', e.target.value)}
                          size="small"
                          sx={{ 
                            ...inputStyles, 
                            minWidth: 180, 
                            borderRadius: 2, 
                            bgcolor: 'background.default',
                            '& .MuiSelect-select': { display: 'flex', alignItems: 'center' }
                          }}
                          displayEmpty
                        >
                          <MenuItem value="LECTURE">
                             <Stack direction="row" spacing={1.5} alignItems="center">
                               <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                               <Typography variant="body2" fontWeight={500}>Lecture</Typography>
                             </Stack>
                          </MenuItem>
                          <MenuItem value="LAB">
                             <Stack direction="row" spacing={1.5} alignItems="center">
                               <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                               <Typography variant="body2" fontWeight={500}>Lab Session</Typography>
                             </Stack>
                          </MenuItem>
                          <MenuItem value="MINOR">
                             <Stack direction="row" spacing={1.5} alignItems="center">
                               <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                               <Typography variant="body2" fontWeight={500}>Minor Course</Typography>
                             </Stack>
                          </MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          onClick={() => deleteTimeSlot(index)}
                          size="small"
                          sx={{ 
                            color: 'text.disabled',
                            transition: 'all 0.2s',
                            '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) }
                          }}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Actions & Help */}
      <Paper sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={2.5}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.info.main, 0.1), 
                color: 'info.main',
                height: 'fit-content'
              }}>
                <InfoOutlined />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Configuration Guidelines
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                  Ensure time slots do not overlap for the same batch. Labs typically require 2-3 consecutive hours.
                  Changes here will affect the next timetable generation.
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack spacing={2} direction="row" justifyContent="flex-end">
              <Button
                variant="text"
                color="error"
                onClick={handleReset}
                disabled={loading}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveRounded />}
                onClick={handleSave}
                disabled={loading}
                size="large"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  '&:hover': { 
                    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.2)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Toast
        open={toast.open}
        onClose={() => setToast({ ...toast, open: false })}
        severity={toast.severity}
        message={toast.message}
      />
    </Stack>
  );
}

export default TimeSlotConfig;
