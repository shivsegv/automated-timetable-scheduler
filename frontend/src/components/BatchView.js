import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Stack,
  Typography,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Box,
  CircularProgress,
  Paper,
  Divider,
  useTheme,
  alpha,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  GroupsRounded,
  SchoolRounded,
  AccessTimeRounded,
  BookRounded,
  SearchRounded,
  ClassRounded,
  PersonRounded,
  RoomRounded,
  CalendarTodayRounded
} from '@mui/icons-material';
import timetableService from '../services/api';

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
            icon={<PersonRounded sx={{ fontSize: '16px !important' }} />}
            label={lesson.facultyName} 
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

const getDurationMinutes = (start, end) => {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  return Math.max(0, (eH * 60 + eM) - (sH * 60 + sM));
};

const buildBatchInsights = (lessons = []) => {
  if (!lessons.length) {
    return {
      totalLessons: 0,
      lectureHours: 0,
      labHours: 0,
      uniqueCourses: []
    };
  }

  const uniqueCoursesMap = new Map();
  let lectureMinutes = 0;
  let labMinutes = 0;

  lessons.forEach((lesson) => {
    if (lesson.courseCode && !uniqueCoursesMap.has(lesson.courseCode)) {
      uniqueCoursesMap.set(lesson.courseCode, {
        code: lesson.courseCode,
        name: lesson.courseName,
        type: lesson.lessonType
      });
    }
    const duration = getDurationMinutes(lesson.startTime, lesson.endTime);
    if (lesson.lessonType === 'LAB') {
      labMinutes += duration;
    } else {
      lectureMinutes += duration;
    }
  });

  return {
    totalLessons: lessons.length,
    lectureHours: +(lectureMinutes / 60).toFixed(1),
    labHours: +(labMinutes / 60).toFixed(1),
    uniqueCourses: Array.from(uniqueCoursesMap.values())
  };
};

function BatchView() {
  const theme = useTheme();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchTimetable, setBatchTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const batchInsights = useMemo(() => buildBatchInsights(batchTimetable), [batchTimetable]);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const response = await timetableService.getBatches();
      setBatches(response.data);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchClick = async (batch) => {
    setSelectedBatch(batch);
    setScheduleLoading(true);
    try {
      const response = await timetableService.getTimetableByBatch(batch.id);
      setBatchTimetable(response.data);
    } catch (error) {
      console.error('Error loading batch timetable:', error);
      setBatchTimetable([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const filteredBatches = batches.filter(b => 
    b.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `Year ${b.year}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '50vh' }}>
        <CircularProgress size={40} thickness={4} />
        <Typography mt={2} color="text.secondary" fontWeight={500}>Loading batches...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Student Batches
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '48ch', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Manage and review student cohorts, their composition, and weekly schedules.
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
            <GroupsRounded />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" letterSpacing="0.05em">
              Total Batches
            </Typography>
            <Typography variant="h5" fontWeight={800} lineHeight={1}>
              {batches.length}
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
              <TextField
                fullWidth
                placeholder="Search batches..."
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
            </Box>
            
            <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {filteredBatches.map((batch) => (
                <ListItemButton
                  key={batch.id}
                  selected={selectedBatch?.id === batch.id}
                  onClick={() => handleBatchClick(batch)}
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
                  <Box sx={{ 
                    mr: 2, 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: selectedBatch?.id === batch.id ? 'primary.main' : 'action.selected',
                    color: selectedBatch?.id === batch.id ? 'white' : 'text.secondary',
                    display: 'grid', 
                    placeItems: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 700
                  }}>
                    {batch.batchName.substring(0, 2).toUpperCase()}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={700}>
                        {batch.batchName}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Year {batch.year} · Section {batch.section}
                      </Typography>
                    }
                  />
                  <Chip 
                    label={batch.studentCount} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      bgcolor: selectedBatch?.id === batch.id ? 'white' : 'action.selected',
                      color: selectedBatch?.id === batch.id ? 'primary.main' : 'text.secondary'
                    }} 
                  />
                </ListItemButton>
              ))}
              {filteredBatches.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No batches found matching "{searchTerm}"
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedBatch ? (
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
                    <Typography variant="h5" fontWeight={800} gutterBottom>
                      {selectedBatch.batchName}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip 
                        icon={<SchoolRounded sx={{ fontSize: '16px !important' }} />}
                        label={`Year ${selectedBatch.year}`} 
                        size="small" 
                        sx={{ borderRadius: 1.5, fontWeight: 600 }}
                      />
                      <Chip 
                        icon={<ClassRounded sx={{ fontSize: '16px !important' }} />}
                        label={`Section ${selectedBatch.section}`} 
                        size="small" 
                        sx={{ borderRadius: 1.5, fontWeight: 600 }}
                      />
                      <Chip 
                        icon={<GroupsRounded sx={{ fontSize: '16px !important' }} />}
                        label={`${selectedBatch.studentCount} Students`} 
                        size="small" 
                        color="primary"
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
                        {batchInsights.totalLessons}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                        LECTURE HRS
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {batchInsights.lectureHours}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                        LAB HRS
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {batchInsights.labHours}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>

              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 0, 
                      borderRadius: 4, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      height: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <BookRounded color="primary" fontSize="small" />
                        <Typography variant="subtitle1" fontWeight={700}>
                          Assigned Courses
                        </Typography>
                      </Stack>
                    </Box>
                    <List sx={{ p: 0, maxHeight: 540, overflowY: 'auto' }}>
                      {batchInsights.uniqueCourses.length ? (
                        batchInsights.uniqueCourses.map((course, index) => (
                          <React.Fragment key={course.code || index}>
                            <Box sx={{ p: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                {course.name}
                              </Typography>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Chip 
                                  label={course.code} 
                                  size="small" 
                                  variant="outlined" 
                                  sx={{ borderRadius: 1, height: 20, fontSize: '0.7rem' }} 
                                />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  {course.type}
                                </Typography>
                              </Stack>
                            </Box>
                            {index < batchInsights.uniqueCourses.length - 1 && <Divider />}
                          </React.Fragment>
                        ))
                      ) : (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No courses assigned yet.
                          </Typography>
                        </Box>
                      )}
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={7}>
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
                    ) : batchTimetable.length ? (
                      <Box sx={{ maxHeight: 600, overflowY: 'auto', pr: 1 }}>
                        <Stack spacing={2}>
                          {batchTimetable.map((lesson) => (
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
                          No schedule published for this batch yet.
                        </Typography>
                      </Paper>
                    )}
                  </Stack>
                </Grid>
              </Grid>
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
                <GroupsRounded sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Select a Batch
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
                Choose a batch from the list to view their detailed composition, course load, and weekly timetable.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}

export default BatchView;
