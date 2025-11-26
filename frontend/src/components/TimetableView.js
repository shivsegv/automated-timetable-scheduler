import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Alert,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { 
  DownloadRounded, 
  RefreshRounded, 
  PlayArrowRounded,
  CalendarMonthOutlined,
  UploadFileRounded,
  SettingsRounded,
  ViewWeekRounded,
  ViewDayRounded,
  GridOnRounded,
  ClassRounded,
  AccessTimeRounded,
  RoomRounded,
  GroupsRounded
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import timetableService from '../services/api';
import EmptyState from './EmptyState';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '09:00-10:30', '10:45-12:15', '12:15-13:15', '13:30-14:30',
  '14:30-16:00', '14:45-16:15', '15:15-16:45', '16:15-17:45',
  '16:30-18:00', '17:00-18:00'
];

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.2s ease-in-out',
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
    '&.Mui-focused': {
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.15)',
      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: 2 }
    }
  }
};

const CompactLessonCard = ({ lesson }) => {
  const theme = useTheme();
  const isLab = lesson.lessonType === 'LAB';
  const isMinor = lesson.lessonType === 'MINOR';
  
  const borderColor = isLab ? theme.palette.warning.main : isMinor ? theme.palette.info.main : theme.palette.primary.main;
  const bgColor = isLab ? alpha(theme.palette.warning.main, 0.02) : isMinor ? alpha(theme.palette.info.main, 0.02) : alpha(theme.palette.primary.main, 0.02);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `3px solid ${borderColor}`,
        bgcolor: bgColor,
        transition: 'all 0.2s ease',
        cursor: 'default',
        '&:hover': {
          transform: 'translateX(2px)',
          boxShadow: theme.palette.mode === 'light' ? '0 4px 12px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.5)',
          borderColor: 'transparent',
          borderLeftColor: borderColor,
          bgcolor: 'background.paper'
        }
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center">
             <AccessTimeRounded sx={{ fontSize: 12, color: 'text.secondary' }} />
             <Typography variant="caption" fontWeight={600} color="text.secondary">
               {lesson.startTime?.substring(0, 5)} - {lesson.endTime?.substring(0, 5)}
             </Typography>
          </Stack>
          <Chip 
            label={lesson.lessonType} 
            size="small" 
            sx={{ 
              height: 16, 
              fontSize: '0.6rem', 
              fontWeight: 700,
              borderRadius: 0.5,
              bgcolor: alpha(borderColor, 0.1),
              color: borderColor
            }} 
          />
        </Stack>

        <Box>
            <Typography variant="subtitle2" fontWeight={700} lineHeight={1.3} sx={{ mb: 0.5 }}>
            {lesson.courseName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {lesson.facultyName}
            </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
             <Chip 
                label={lesson.batchName}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', borderRadius: 1, borderColor: 'divider' }}
             />
             <Chip 
                icon={<RoomRounded sx={{ fontSize: '12px !important' }} />}
                label={lesson.roomNumber}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', borderRadius: 1, borderColor: 'divider', '& .MuiChip-icon': { ml: 0.5 } }}
             />
        </Stack>
      </Stack>
    </Paper>
  );
};

const LessonCard = ({ lesson }) => {
  const theme = useTheme();
  const isLab = lesson.lessonType === 'LAB';
  const isMinor = lesson.lessonType === 'MINOR';
  
  const borderColor = isLab ? theme.palette.warning.main : isMinor ? theme.palette.info.main : theme.palette.primary.main;
  const bgColor = isLab ? alpha(theme.palette.warning.main, 0.02) : isMinor ? alpha(theme.palette.info.main, 0.02) : alpha(theme.palette.primary.main, 0.02);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${borderColor}`,
        bgcolor: bgColor,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'light' ? '0 8px 24px rgba(148, 163, 184, 0.15)' : '0 8px 24px rgba(0, 0, 0, 0.5)',
          borderColor: 'transparent',
          borderLeftColor: borderColor,
          bgcolor: 'background.paper'
        }
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
            <AccessTimeRounded sx={{ fontSize: 16 }} />
            <Typography variant="body2" fontWeight={600}>
              {lesson.startTime?.substring(0, 5)} – {lesson.endTime?.substring(0, 5)}
            </Typography>
          </Stack>
          <Chip 
            label={lesson.lessonType} 
            size="small" 
            sx={{ 
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: alpha(borderColor, 0.1),
              color: borderColor,
              borderRadius: 1
            }} 
          />
        </Stack>

        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.3} gutterBottom>
            {lesson.courseName}
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            {lesson.facultyName}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip 
            icon={<GroupsRounded sx={{ fontSize: '16px !important' }} />}
            label={lesson.batchName} 
            size="small" 
            variant="outlined"
            sx={{ borderRadius: 1.5, height: 28, borderColor: 'divider', fontWeight: 500 }} 
          />
          <Chip 
            icon={<RoomRounded sx={{ fontSize: '16px !important' }} />}
            label={lesson.roomNumber} 
            size="small" 
            variant="outlined"
            sx={{ borderRadius: 1.5, height: 28, borderColor: 'divider', fontWeight: 500 }} 
          />
        </Stack>
      </Stack>
    </Paper>
  );
};

function TimetableView() {
  const theme = useTheme();
  const [timetable, setTimetable] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('week');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBatch !== 'all') {
      loadBatchTimetable(selectedBatch);
    } else {
      loadTimetable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [timetableRes, batchesRes] = await Promise.all([
        timetableService.getTimetable(),
        timetableService.getBatches(),
      ]);
      setTimetable(timetableRes.data);
      setBatches(batchesRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const loadTimetable = async () => {
    try {
      const response = await timetableService.getTimetable();
      setTimetable(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timetable');
    }
  };

  const loadBatchTimetable = async (batchId) => {
    try {
      const response = await timetableService.getTimetableByBatch(batchId);
      setTimetable({ lessons: response.data, minorLessons: [] });
    } catch (err) {
      setError('Failed to load batch timetable');
    }
  };

  const formatTime = (time) => (time ? time.substring(0, 5) : '');

  const lessons = useMemo(() => {
    if (!timetable) return [];
    const all = [...(timetable.lessons || []), ...(timetable.minorLessons || [])];
    return all.filter((lesson) => lesson.day && lesson.startTime && lesson.endTime);
  }, [timetable]);

  const groupedLessons = useMemo(() => {
    const grouped = {};
    days.forEach((day) => {
      grouped[day] = lessons
        .filter((lesson) => lesson.day === day)
        .sort((a, b) => formatTime(a.startTime).localeCompare(formatTime(b.startTime)));
    });
    return grouped;
  }, [lessons]);

  const exportToCSV = () => {
    const sorted = [...lessons].sort((a, b) => {
      const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
      const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
      if (dayDiff !== 0) return dayDiff;
      return formatTime(a.startTime).localeCompare(formatTime(b.startTime));
    });

    let csvContent = 'Day,Time,Room,Batch,Course,Type,Faculty\n';
    sorted.forEach((lesson) => {
      const time = `${formatTime(lesson.startTime)}-${formatTime(lesson.endTime)}`;
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
    link.download = 'timetable.csv';
    link.click();
  };

  // Fix issues #9, #10, #11, #12: Better empty state with actionable steps
  const renderEmptyState = (title, description, includeAlert = false) => (
    <Box>
      {includeAlert && error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <EmptyState
        icon={CalendarMonthOutlined}
        title={title}
        description={description}
        variant="large"
        actions={[
          {
            label: 'Upload CSV Data',
            to: '/csv-manager',
            icon: <UploadFileRounded />,
            variant: 'outlined'
          },
          {
            label: 'Configure Settings',
            to: '/',
            icon: <SettingsRounded />,
            variant: 'outlined'
          },
          {
            label: 'Generate Timetable',
            to: '/',
            icon: <PlayArrowRounded />,
            variant: 'contained'
          },
          {
            label: 'Retry',
            onClick: loadData,
            icon: <RefreshRounded />,
            variant: 'outlined',
            color: 'secondary'
          }
        ]}
      />
      
      {!error && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Before generating a timetable, ensure:
            </Typography>
            <Stack component="ul" spacing={1} sx={{ pl: 2, mt: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                All required CSV files are uploaded (Batches, Faculty, Rooms, Courses)
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Time slots are configured for each academic year
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Batch-year mappings are properly set up
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Solver constraints are configured appropriately
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center" py={4} textAlign="center">
            <CircularProgress color="primary" />
            <Typography fontWeight={600}>Fetching the latest timetable…</Typography>
            <Typography variant="body2" color="text.secondary">
              We&apos;ll render the schedule the moment it&apos;s ready.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return renderEmptyState('Timetable not ready', 'We could not find a published schedule yet.', true);
  }

  const hasLessons = lessons.length > 0;

  if (!hasLessons) {
    return renderEmptyState(
      'No sessions published yet',
      'Generate a fresh timetable from the dashboard or import one via CSV to preview it here.'
    );
  }

  const renderWeekView = () => (
    <Box sx={{ height: 'calc(100vh - 300px)', mt: 2, overflowY: 'scroll' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {days.map((day) => (
          <Grid item xs={12} md={6} lg={2.4} key={day} sx={{ height: '100%' }}>
            <Paper 
              elevation={0} 
              sx={{ 
                height: '100%', 
                bgcolor: 'background.default',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  {day}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {groupedLessons[day]?.length || 0} sessions
                </Typography>
              </Box>
              <Stack spacing={1} p={1.5} sx={{ flex: 1, overflowY: 'auto' }}>
                {groupedLessons[day]?.length ? (
                  groupedLessons[day].map((lesson) => (
                    <CompactLessonCard key={lesson.id} lesson={lesson} />
                  ))
                ) : (
                  <Box 
                    sx={{ 
                      py: 6, 
                      textAlign: 'center', 
                      color: 'text.secondary',
                      opacity: 0.5
                    }}
                  >
                    <Typography variant="caption" display="block">No classes</Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderDayView = () => (
    <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'scroll', mt: 2 }}>
      <Grid container spacing={2}>
        {(groupedLessons[selectedDay] || []).length ? (
          groupedLessons[selectedDay].map((lesson) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={lesson.id}>
              <LessonCard lesson={lesson} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 8, 
                textAlign: 'center', 
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>No classes scheduled for {selectedDay}</Typography>
              <Typography variant="body2" color="text.secondary">Enjoy your free time!</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderTableView = () => (
    <TableContainer 
      component={Paper} 
      elevation={0}
      sx={{ 
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: 'divider',
        maxHeight: 'calc(100vh - 300px)',
        mt: 2,
        overflowY: 'scroll'
      }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell 
              sx={{ 
                bgcolor: 'background.paper', 
                fontWeight: 700,
                borderBottom: '2px solid',
                borderColor: 'divider',
                width: 120
              }}
            >
              Time Slot
            </TableCell>
            {days.map((day) => (
              <TableCell 
                key={day}
                sx={{ 
                  bgcolor: 'background.paper', 
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  minWidth: 200
                }}
              >
                {day}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {timeSlots.map((slot) => (
            <TableRow key={slot} hover>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.secondary',
                  bgcolor: 'background.default',
                  borderRight: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {slot}
              </TableCell>
              {days.map((day) => {
                const lessonsAtTime = groupedLessons[day]?.filter((lesson) => {
                  const lessonTime = `${formatTime(lesson.startTime)}-${formatTime(lesson.endTime)}`;
                  return lessonTime === slot;
                }) || [];
                return (
                  <TableCell 
                    key={`${day}-${slot}`} 
                    sx={{ 
                      p: 1, 
                      verticalAlign: 'top',
                      bgcolor: lessonsAtTime.length > 0 ? 'transparent' : 'rgba(0,0,0,0.01)'
                    }}
                  >
                    <Stack spacing={1}>
                      {lessonsAtTime.map((lesson) => {
                        const isLab = lesson.lessonType === 'LAB';
                        const isMinor = lesson.lessonType === 'MINOR';
                        const borderColor = isLab ? theme.palette.warning.main : isMinor ? theme.palette.info.main : theme.palette.primary.main;
                        const bgColor = isLab ? alpha(theme.palette.warning.main, 0.02) : isMinor ? alpha(theme.palette.info.main, 0.02) : alpha(theme.palette.primary.main, 0.02);

                        return (
                          <Paper 
                            key={lesson.id} 
                            elevation={0}
                            sx={{ 
                              p: 1.5, 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderLeft: `3px solid ${borderColor}`,
                              bgcolor: bgColor,
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                transform: 'translateY(-2px)', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                borderColor: 'transparent',
                                borderLeftColor: borderColor,
                                bgcolor: 'background.paper'
                              }
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" fontWeight={700} sx={{ color: borderColor, bgcolor: alpha(borderColor, 0.1), px: 0.8, py: 0.2, borderRadius: 0.5 }}>
                                  {lesson.lessonType}
                                </Typography>
                              </Stack>
                              
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.3} noWrap title={lesson.courseName}>
                                  {lesson.courseName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap display="block" title={lesson.facultyName}>
                                  {lesson.facultyName}
                                </Typography>
                              </Box>

                              <Stack direction="row" spacing={1} alignItems="center">
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.5, py: 0.25 }}>
                                  <GroupsRounded sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {lesson.batchName}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.5, py: 0.25 }}>
                                  <RoomRounded sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {lesson.roomNumber}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Master Schedule
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '48ch', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Explore week, day, or grid perspectives of the latest schedule.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          {timetable?.score && (
            <Paper 
              elevation={0}
              sx={{ 
                px: 2, 
                py: 1, 
                borderRadius: 2, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                <ClassRounded fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block">
                  Conflict Score
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1}>
                  {timetable.score}
                </Typography>
              </Box>
            </Paper>
          )}
          <Button 
            variant="outlined" 
            startIcon={<DownloadRounded />} 
            onClick={exportToCSV}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              height: 48
            }}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          borderRadius: 3, 
          border: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2} 
          justifyContent="space-between" 
          alignItems="center"
        >
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, mode) => mode && setViewMode(mode)}
            sx={{ 
              bgcolor: 'background.default', 
              p: 0.5, 
              borderRadius: 2,
              width: { xs: '100%', md: 'auto' },
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.secondary',
                px: 2,
                py: 0.75,
                flex: { xs: 1, md: 'initial' },
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
            <ToggleButton value="week">
              <ViewWeekRounded fontSize="small" sx={{ mr: 1 }} />
              Week
            </ToggleButton>
            <ToggleButton value="day">
              <ViewDayRounded fontSize="small" sx={{ mr: 1 }} />
              Day
            </ToggleButton>
            <ToggleButton value="table">
              <GridOnRounded fontSize="small" sx={{ mr: 1 }} />
              Grid
            </ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
              <InputLabel id="batch-select">Filter by Batch</InputLabel>
              <Select
                labelId="batch-select"
                label="Filter by Batch"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                sx={inputStyles}
              >
                <MenuItem value="all">All Batches</MenuItem>
                {batches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>
                    {batch.batchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ width: 210 }}>
              <FormControl fullWidth size="small" disabled={viewMode !== 'day'}>
                <InputLabel id="day-select">Select Day</InputLabel>
                <Select
                  labelId="day-select"
                  label="Select Day"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  sx={inputStyles}
                >
                  {days.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ animation: 'fadeIn 0.3s ease-in-out', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
        {viewMode === 'table' && renderTableView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </Box>
    </Stack>
  );
}

export default TimetableView;
