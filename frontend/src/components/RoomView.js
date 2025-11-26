import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  useTheme,
  alpha,
  Avatar,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  SearchRounded,
  MeetingRoomRounded,
  AccessTimeRounded,
  CheckCircleRounded,
  CancelRounded,
  GroupsRounded,
  PersonRounded,
  ClassRounded,
  CalendarTodayRounded,
  ScienceRounded,
  ChairAltRounded
} from '@mui/icons-material';
import timetableService from '../services/api';
import Toast from './Toast';

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
          <Chip 
            label={lesson.day} 
            size="small" 
            sx={{ 
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: alpha(theme.palette.text.primary, 0.05),
              color: 'text.primary',
              borderRadius: 1
            }} 
          />
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
            <AccessTimeRounded sx={{ fontSize: 16 }} />
            <Typography variant="body2" fontWeight={600}>
              {lesson.startTime} – {lesson.endTime}
            </Typography>
          </Stack>
        </Stack>

        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.3} gutterBottom>
            {lesson.courseName}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
             <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {lesson.courseCode}
             </Typography>
             <Chip 
                label={lesson.lessonType} 
                size="small" 
                sx={{ 
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: alpha(borderColor, 0.1),
                  color: borderColor,
                  borderRadius: 0.5
                }} 
              />
          </Stack>
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
            icon={<PersonRounded sx={{ fontSize: '16px !important' }} />}
            label={lesson.facultyName} 
            size="small" 
            variant="outlined"
            sx={{ borderRadius: 1.5, height: 28, borderColor: 'divider', fontWeight: 500 }} 
          />
        </Stack>
      </Stack>
    </Paper>
  );
};

const getDurationMinutes = (start, end) => {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  return Math.max(0, (eH * 60 + eM) - (sH * 60 + sM));
};

const buildRoomInsights = (lessons = []) => {
  if (!lessons.length) {
    return {
      totalSessions: 0,
      utilizationHours: 0,
      uniqueBatches: 0
    };
  }

  const uniqueBatches = new Set(lessons.map(l => l.batchName)).size;
  let totalMinutes = 0;

  lessons.forEach((lesson) => {
    totalMinutes += getDurationMinutes(lesson.startTime, lesson.endTime);
  });

  return {
    totalSessions: lessons.length,
    utilizationHours: +(totalMinutes / 60).toFixed(1),
    uniqueBatches
  };
};

function RoomView() {
  const theme = useTheme();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomTimetable, setRoomTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [toast, setToast] = useState({ open: false, severity: 'info', message: '' });

  const roomInsights = useMemo(() => buildRoomInsights(roomTimetable), [roomTimetable]);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await timetableService.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setToast({ open: true, severity: 'error', message: 'Unable to load rooms right now.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = async (room) => {
    setSelectedRoom(room);
    setScheduleLoading(true);
    try {
      const response = await timetableService.getTimetableByRoom(room.id);
      setRoomTimetable(response.data);
    } catch (error) {
      console.error('Error loading room timetable:', error);
      setRoomTimetable([]);
      setToast({ open: true, severity: 'error', message: 'Failed to load this room schedule.' });
    } finally {
      setScheduleLoading(false);
    }
  };

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesType = true;
    if (roomTypeFilter !== 'all') {
      matchesType = r.roomType.includes(roomTypeFilter);
    }
    return matchesSearch && matchesType;
  });



  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '50vh' }}>
        <CircularProgress size={40} thickness={4} />
        <Typography mt={2} color="text.secondary" fontWeight={500}>Loading rooms...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Toast 
        open={toast.open} 
        severity={toast.severity} 
        message={toast.message} 
        onClose={() => setToast({ ...toast, open: false })} 
      />

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Room Directory
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '48ch', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Manage classroom allocation, check capacity, and view daily schedules.
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
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.08), color: 'success.main' }}>
            <MeetingRoomRounded />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" letterSpacing="0.05em">
              Total Rooms
            </Typography>
            <Typography variant="h5" fontWeight={800} lineHeight={1}>
              {rooms.length}
            </Typography>
          </Box>
        </Paper>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              height: 'calc(100vh - 200px)', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: 'background.paper',
                      '& fieldset': { border: 'none' },
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      borderRadius: 2
                    }
                  }}
                />
                <ToggleButtonGroup
                  value={roomTypeFilter}
                  exclusive
                  onChange={(e, newVal) => newVal && setRoomTypeFilter(newVal)}
                  size="small"
                  fullWidth
                  sx={{ 
                    bgcolor: 'background.paper',
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      borderRadius: 2,
                      mx: 0.5,
                      py: 0.5,
                      textTransform: 'capitalize',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      '&.Mui-selected': {
                        bgcolor: 'white',
                        color: 'primary.main',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }
                    },
                    p: 0.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="LECTURE">Lectures</ToggleButton>
                  <ToggleButton value="LAB">Labs</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Box>
            
            <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {filteredRooms.map((room) => (
                <ListItemButton
                  key={room.id}
                  selected={selectedRoom?.id === room.id}
                  onClick={() => handleRoomClick(room)}
                  sx={{ 
                    borderRadius: 3, 
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'transparent',
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      }
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'divider'
                    }
                  }}
                >
                  <Avatar 
                    variant="rounded"
                    sx={{ 
                      mr: 2, 
                      bgcolor: selectedRoom?.id === room.id ? 'primary.main' : alpha(theme.palette.primary.main, 0.1),
                      color: selectedRoom?.id === room.id ? 'white' : 'primary.main',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      width: 48,
                      height: 48,
                      borderRadius: 2.5
                    }}
                  >
                    {room.roomNumber.substring(0, 3)}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={700}>
                        {room.roomNumber}
                      </Typography>
                    }
                    secondary={
                      <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                        <Chip 
                          label={`${room.capacity} seats`} 
                          size="small" 
                          sx={{ height: 20, fontSize: '0.65rem', borderRadius: 1 }} 
                        />
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          {room.roomType.includes('LAB') ? 'Laboratory' : 'Lecture Hall'}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItemButton>
              ))}
              {filteredRooms.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No rooms found matching your criteria.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedRoom ? (
            <Stack spacing={3}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.background.default, 0.5)} 100%)`
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                      <Avatar 
                        variant="rounded"
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          bgcolor: 'primary.main', 
                          fontSize: '1.2rem', 
                          fontWeight: 800,
                          borderRadius: 3,
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        {selectedRoom.roomNumber}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight={800}>
                          Room {selectedRoom.roomNumber}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {selectedRoom.roomType.includes('LAB') ? (
                            <ScienceRounded sx={{ fontSize: 16, color: 'warning.main' }} />
                          ) : (
                            <ClassRounded sx={{ fontSize: 16, color: 'primary.main' }} />
                          )}
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {selectedRoom.roomType.includes('LAB') ? 'Laboratory Complex' : 'Lecture Hall'}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                    
                    <Stack direction="row" spacing={1} mt={2}>
                      <Chip 
                        icon={<ChairAltRounded sx={{ fontSize: '16px !important' }} />}
                        label={`Capacity: ${selectedRoom.capacity}`} 
                        size="small" 
                        sx={{ borderRadius: 1.5, fontWeight: 600 }}
                      />
                      <Chip 
                        icon={selectedRoom.isAvailable ? <CheckCircleRounded sx={{ fontSize: '16px !important' }} /> : <CancelRounded sx={{ fontSize: '16px !important' }} />}
                        label={selectedRoom.isAvailable ? 'Available' : 'Maintenance'} 
                        size="small" 
                        color={selectedRoom.isAvailable ? 'success' : 'default'}
                        variant={selectedRoom.isAvailable ? 'filled' : 'outlined'}
                        sx={{ borderRadius: 1.5, fontWeight: 600 }}
                      />
                    </Stack>
                  </Box>
                  
                  <Stack direction="row" spacing={3} sx={{ px: 3, py: 1.5, bgcolor: 'background.default', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                        SESSIONS
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {roomInsights.totalSessions}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                        UTILIZATION
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {roomInsights.utilizationHours}h
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                        BATCHES
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {roomInsights.uniqueBatches}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>

              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <CalendarTodayRounded color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Weekly Schedule
                  </Typography>
                </Stack>
                
                {scheduleLoading ? (
                  <Stack alignItems="center" py={6}>
                    <CircularProgress size={32} />
                  </Stack>
                ) : roomTimetable.length ? (
                  <Box sx={{ maxHeight: 600, overflowY: 'auto', pr: 1 }}>
                    <Stack spacing={2}>
                      {roomTimetable.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      borderRadius: 4, 
                      border: '1px dashed', 
                      borderColor: 'divider',
                      bgcolor: 'background.default' 
                    }}
                  >
                    <Typography color="text.secondary" fontWeight={500}>
                      No classes scheduled in this room.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </Stack>
          ) : (
            <Paper 
              elevation={0}
              sx={{ 
                height: '100%', 
                minHeight: 400,
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'background.default',
                p: 4
              }}
            >
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'action.hover', 
                  display: 'grid', 
                  placeItems: 'center', 
                  mb: 3 
                }}
              >
                <MeetingRoomRounded sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Select a Room
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
                Choose a room from the directory to view its capacity, type, and weekly schedule.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}

export default RoomView;
