import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  Collapse,
  IconButton,
  Paper,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha
} from '@mui/material';
import {
  SettingsRounded,
  PlayArrowRounded,
  Groups2Outlined,
  SchoolOutlined,
  MeetingRoomOutlined,
  MenuBookOutlined,
  UploadFileRounded,
  SchemaOutlined,
  AccessTimeRounded,
  CalendarMonthOutlined,
  ArrowForwardRounded,
  CheckCircleRounded,
  PendingRounded,
  ErrorRounded,
  AddRounded,
  DownloadRounded
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import timetableService from '../services/api';
import SolverConfig from './SolverConfig';
import { formatRelativeTime } from '../utils/formatters';
import Toast from './Toast';

function Dashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState({
    batches: 0,
    faculty: 0,
    rooms: 0,
    courses: 0,
  });
  const [generating, setGenerating] = useState(false);
  const [timetableGenerated, setTimetableGenerated] = useState(false);
  const [solverConfig, setSolverConfig] = useState(null);
  const [showConfig, setShowConfig] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null); // Fix issue #5
  const [toast, setToast] = useState({ open: false, severity: 'info', message: '' });
  const [activeCollection, setActiveCollection] = useState('Outline');

  useEffect(() => {
    loadStats();
    checkTimetableExists();
  }, []);

  const loadStats = async () => {
    try {
      const [batchesRes, facultyRes, roomsRes, coursesRes] = await Promise.all([
        timetableService.getBatches(),
        timetableService.getFaculty(),
        timetableService.getRooms(),
        timetableService.getCourses(),
      ]);

      setStats({
        batches: batchesRes.data.length,
        faculty: facultyRes.data.length,
        rooms: roomsRes.data.length,
        courses: coursesRes.data.length,
      });
      setLastRefreshed(new Date()); // Fix issue #5: Track actual refresh time
    } catch (error) {
      console.error('Error loading stats:', error);
      setToast({ open: true, severity: 'error', message: 'Unable to refresh dataset counts right now.' });
    }
  };

  const checkTimetableExists = async () => {
    try {
      const response = await timetableService.getTimetable();
      if (response.data && response.data.lessons) {
        setTimetableGenerated(true);
      }
    } catch (error) {
      setTimetableGenerated(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await timetableService.generateTimetable(solverConfig);
      setToast({
        open: true,
        severity: 'success',
        message: `${response.data.message}. Score: ${response.data.score}`
      });
      setTimetableGenerated(true);
      loadStats();
    } catch (error) {
      setToast({
        open: true,
        severity: 'error',
        message: error.response?.data?.error || 'Timetable generation failed.'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleConfigChange = (config) => {
    setSolverConfig(config);
  };

  const handleExport = async () => {
    try {
      const response = await timetableService.getTimetable();
      const data = response.data;
      
      if (!data || (!data.lessons && !data.minorLessons)) {
        setToast({
          open: true,
          severity: 'warning',
          message: 'No timetable data available to export.'
        });
        return;
      }

      const allLessons = [
        ...(data.lessons || []),
        ...(data.minorLessons || [])
      ];

      if (allLessons.length === 0) {
        setToast({
          open: true,
          severity: 'warning',
          message: 'No timetable data available to export.'
        });
        return;
      }

      const sorted = [...allLessons].sort((a, b) => {
        const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
        const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
        if (dayDiff !== 0) return dayDiff;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });

      let csvContent = 'Day,Time,Room,Batch,Course,Type,Faculty\n';
      sorted.forEach((lesson) => {
        const time = `${lesson.startTime?.substring(0, 5)}-${lesson.endTime?.substring(0, 5)}`;
        const row = [
          lesson.day || '',
          time,
          lesson.roomNumber || '',
          lesson.batchName || '',
          lesson.courseName || '',
          lesson.lessonType || 'LECTURE',
          lesson.facultyName || ''
        ].map((field) => `"${field}"`).join(',');
        csvContent += `${row}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'timetable_export.csv';
      link.click();
      
      setToast({
        open: true,
        severity: 'success',
        message: 'Timetable exported successfully.'
      });

    } catch (error) {
      console.error('Export error:', error);
      setToast({
        open: true,
        severity: 'error',
        message: 'Failed to export timetable data.'
      });
    }
  };

  // Fix issue #1: Proper labels without truncation
  const statCards = [
    { 
      label: 'Student Batches', 
      value: stats.batches, 
      icon: <Groups2Outlined fontSize="small" />, 
      key: 'batches', 
      color: theme.palette.mode === 'light' ? '#3b82f6' : '#60a5fa', 
      bg: theme.palette.mode === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)' 
    },
    { 
      label: 'Faculty Members', 
      value: stats.faculty, 
      icon: <SchoolOutlined fontSize="small" />, 
      key: 'faculty', 
      color: theme.palette.mode === 'light' ? '#059669' : '#34d399', 
      bg: theme.palette.mode === 'light' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(5, 150, 105, 0.2)' 
    },
    { 
      label: 'Rooms Available', 
      value: stats.rooms, 
      icon: <MeetingRoomOutlined fontSize="small" />, 
      key: 'rooms', 
      color: theme.palette.mode === 'light' ? '#d97706' : '#fbbf24', 
      bg: theme.palette.mode === 'light' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(217, 119, 6, 0.2)' 
    },
    { 
      label: 'Active Courses', 
      value: stats.courses, 
      icon: <MenuBookOutlined fontSize="small" />, 
      key: 'courses', 
      color: theme.palette.mode === 'light' ? '#0891b2' : '#22d3ee', 
      bg: theme.palette.mode === 'light' ? 'rgba(8, 145, 178, 0.1)' : 'rgba(8, 145, 178, 0.2)' 
    },
  ];

  const quickActions = [
    { title: 'Manage CSV data', description: 'Upload and validate the datasets that fuel the solver.', path: '/csv-manager', icon: <UploadFileRounded fontSize="small" /> },
    { title: 'Configure time slots', description: 'Adjust lecture, lab, and minor cadences by batch.', path: '/timeslots', icon: <AccessTimeRounded fontSize="small" /> },
    { title: 'Batch-year mapping', description: 'Keep cohorts aligned with their academic level.', path: '/batch-mapping', icon: <SchemaOutlined fontSize="small" /> },
    { title: 'Review timetable', description: 'Inspect the newest schedule and share exports.', path: '/timetable', icon: <CalendarMonthOutlined fontSize="small" /> },
  ];

  const focusSections = [
    {
      title: 'Upload CSV datasets',
      description: 'Ensure batches, rooms, and faculty files are validated.',
      type: 'Data hygiene',
      statusTone: 'done',
      statusText: 'Files synced',
      target: '4 sources',
      owner: 'Data Desk'
    },
    {
      title: 'Tune solver weights',
      description: 'Adjust penalties for gaps, labs, and minor requests.',
      type: 'Solver profile',
      statusTone: 'progress',
      statusText: 'In process',
      target: 'Due today',
      owner: 'Ops Squad'
    },
    {
      title: 'Review batch-year map',
      description: 'Confirm every cohort points to the correct academic year.',
      type: 'Cohort mapping',
      statusTone: 'alert',
      statusText: 'Needs attention',
      target: '2 pending',
      owner: 'Academic lead'
    },
    {
      title: 'Publish timetable',
      description: 'Push the latest timetable to stakeholders.',
      type: 'Distribution',
      statusTone: timetableGenerated ? 'done' : 'pending',
      statusText: timetableGenerated ? 'Published' : 'Awaiting run',
      target: timetableGenerated ? 'Live' : 'Queue new run',
      owner: 'Scheduler core'
    }
  ];

  const statusTokens = {
    done: { 
      bg: theme.palette.mode === 'light' ? 'rgba(21,128,61,0.14)' : 'rgba(34, 197, 94, 0.15)', 
      color: theme.palette.mode === 'light' ? '#15803d' : '#4ade80', 
      label: 'Done' 
    },
    progress: { 
      bg: theme.palette.mode === 'light' ? 'rgba(161, 98, 7, 0.15)' : 'rgba(251, 191, 36, 0.15)', 
      color: theme.palette.mode === 'light' ? '#92400e' : '#fbbf24', 
      label: 'In process' 
    },
    alert: { 
      bg: theme.palette.mode === 'light' ? 'rgba(185, 28, 28, 0.15)' : 'rgba(248, 113, 113, 0.15)', 
      color: theme.palette.mode === 'light' ? '#b91c1c' : '#f87171', 
      label: 'Needs review' 
    },
    pending: { 
      bg: theme.palette.mode === 'light' ? 'rgba(15,15,15,0.08)' : 'rgba(255, 255, 255, 0.08)', 
      color: theme.palette.mode === 'light' ? '#111111' : '#e4e4e7', 
      label: 'Pending' 
    }
  };

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={3}
      >
        <Stack spacing={1} maxWidth={640}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Academic Operations
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '48ch', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Manage resources, configure constraints, and generate optimized timetables efficiently from a central command center.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            size="medium"
            startIcon={<DownloadRounded />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            onClick={handleExport}
          >
            Export data
          </Button>
          <Button
            variant="contained"
            size="medium"
            startIcon={<PlayArrowRounded />}
            onClick={handleGenerate}
            disabled={generating}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              boxShadow: '0 4px 14px 0 rgba(15, 23, 42, 0.2)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.25)'
              }
            }}
          >
            {generating ? 'Generating' : 'Quick create'}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.key}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
                  borderColor: 'primary.main'
                }
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: card.bg, 
                      color: card.color,
                      display: 'inline-flex'
                    }}
                  >
                    {card.icon}
                  </Box>
                </Stack>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {card.label}
                  </Typography>
                </Box>
                <Divider />
                <Tooltip title={lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleString()}` : 'Not yet loaded'} arrow>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 500 }}>
                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', display: 'inline-block', boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)' }} />
                    {lastRefreshed ? `Updated ${formatRelativeTime(lastRefreshed)}` : 'Loading…'}
                  </Typography>
                </Tooltip>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 4 }, 
              borderRadius: 3, 
              border: '1px solid', 
              borderColor: 'divider', 
              boxShadow: 'none' 
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>Timetable run</Typography>
                <Typography variant="body2" color="text.secondary">
                  Fine-tune solver constraints before triggering a new schedule.
                </Typography>
              </Box>
              <Tooltip title={showConfig ? 'Hide solver settings' : 'Show solver settings'} arrow>
                <IconButton
                  onClick={() => setShowConfig((prev) => !prev)}
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 2,
                    color: 'text.secondary'
                  }}
                >
                  <SettingsRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Collapse in={showConfig} timeout={400} unmountOnExit>
              <Box mt={3}>
                <SolverConfig onConfigChange={handleConfigChange} />
              </Box>
            </Collapse>
            <Divider sx={{ my: 3 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                variant="contained"
                size="large"
                startIcon={<PlayArrowRounded />}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  '&:hover': { 
                    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.2)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {generating ? 'Generating timetable' : 'Generate timetable'}
              </Button>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {showConfig ? 'Double-check constraints above before running.' : 'Using the last saved solver profile.'}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                border: '1px solid', 
                borderColor: 'divider', 
                boxShadow: 'none' 
              }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
                  System snapshot
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Timetable state</Typography>
                  <Chip
                    label={timetableGenerated ? 'Published' : 'Not generated'}
                    color={timetableGenerated ? 'success' : 'warning'}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600, borderRadius: 1.5 }}
                  />
                </Stack>
                <Typography variant="body2" color="text.primary">
                  {timetableGenerated ? 'The latest schedule is ready for review.' : 'Generate a fresh timetable to publish new slots.'}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      API latency
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      Stable · 112ms
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Last refresh
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {lastRefreshed ? formatRelativeTime(lastRefreshed) : '—'}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                border: '1px solid', 
                borderColor: 'divider', 
                boxShadow: 'none' 
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
                  Cohort coverage
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>100%</Typography>
                <Typography variant="body2" color="text.secondary">
                  All batches currently map to a defined academic year profile.
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 3, 
          border: '1px solid', 
          borderColor: 'divider', 
          boxShadow: 'none',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {['Outline', 'Past Performance', 'Key Personnel', 'Focus Documents'].map((filter) => (
                <Button
                  key={filter}
                  size="small"
                  variant={activeCollection === filter ? 'contained' : 'text'}
                  onClick={() => setActiveCollection(filter)}
                  sx={{ 
                    borderRadius: 2, 
                    px: 2, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    boxShadow: 'none',
                    bgcolor: activeCollection === filter ? 'primary.main' : 'transparent',
                    color: activeCollection === filter ? 'common.white' : 'text.secondary',
                    '&:hover': {
                      bgcolor: activeCollection === filter ? 'primary.dark' : 'action.hover'
                    }
                  }}
                >
                  {filter}
                </Button>
              ))}
            </Stack>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<AddRounded />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Add section
            </Button>
          </Stack>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Section</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Status</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Target</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Owner</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {focusSections.map((section) => {
                const tone = statusTokens[section.statusTone];
                return (
                  <TableRow key={section.title} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{section.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{section.description}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>{section.type}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={section.statusText || tone.label}
                        icon={
                          section.statusTone === 'done' ? <CheckCircleRounded sx={{ fontSize: '14px !important' }} /> :
                          section.statusTone === 'alert' ? <ErrorRounded sx={{ fontSize: '14px !important' }} /> :
                          <PendingRounded sx={{ fontSize: '14px !important' }} />
                        }
                        sx={{
                          borderRadius: 1.5,
                          backgroundColor: tone.bg,
                          color: tone.color,
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: 'transparent',
                          '& .MuiChip-icon': { color: 'inherit' }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="text.primary">{section.target}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>{section.owner}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Grid container spacing={2}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.title}>
            <Paper
              component={RouterLink}
              to={action.path}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                textDecoration: 'none',
                color: 'inherit',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
                  borderColor: 'primary.main',
                  '& .action-icon': {
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    transform: 'scale(1.1)'
                  },
                  '& .action-arrow': {
                    transform: 'translateX(4px)',
                    color: 'primary.main'
                  }
                }
              }}
            >
              <Stack spacing={2} height="100%">
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                  <Box 
                    className="action-icon"
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 2, 
                      bgcolor: alpha(theme.palette.primary.main, 0.08), 
                      color: 'primary.main',
                      display: 'grid', 
                      placeItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="overline" sx={{ letterSpacing: '0.1em', fontWeight: 700, color: 'text.secondary' }}>
                    Workflow
                  </Typography>
                </Stack>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{action.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {action.description}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.875rem' }}>
                  <Box component="span">Open</Box>
                  <ArrowForwardRounded className="action-arrow" sx={{ fontSize: 18, transition: 'transform 0.2s' }} />
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Toast
        open={toast.open}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        severity={toast.severity}
        message={toast.message}
      />
    </Stack>
  );
}

export default Dashboard;
