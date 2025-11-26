import React, { useContext } from 'react';
import { Box, Button, Container, Grid, Stack, Typography, useTheme, alpha, Paper, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  PlayArrowRounded,
  AutoAwesomeRounded,
  SpeedRounded,
  SecurityRounded,
  SchemaOutlined,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { ColorModeContext } from '../App';

function LandingPage() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Box component="nav" sx={{ py: 3, px: { xs: 3, md: 6 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 8px 16px -4px rgba(15, 23, 42, 0.2)'
              }}
            >
              <SchemaOutlined />
            </Box>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em" color="text.primary">
              Atlas Scheduler
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <Button
              component={RouterLink}
              to="/dashboard"
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Sign In
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: 8 }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={4}>
              <Box>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: 999,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    mb: 3
                  }}
                >
                  <AutoAwesomeRounded fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    v2.4 Now Available
                  </Typography>
                </Box>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    mb: 2,
                    background: theme.palette.mode === 'light' 
                      ? 'linear-gradient(135deg, #0f172a 0%, #334155 100%)'
                      : 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Intelligent scheduling for modern academia.
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.6, maxWidth: '90%' }}>
                  Eliminate conflicts and optimize resource allocation with our AI-driven timetable engine. Designed for complex institutions.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  variant="contained"
                  size="large"
                  endIcon={<PlayArrowRounded />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 24px rgba(15, 23, 42, 0.2)'
                    }
                  }}
                >
                  Launch Dashboard
                </Button>
                <Button
                  variant="text"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    color: 'text.secondary'
                  }}
                >
                  View Documentation
                </Button>
              </Stack>

              <Stack direction="row" spacing={4} sx={{ pt: 2 }}>
                {[
                  { label: 'Conflict Free', value: '100%' },
                  { label: 'Institutions', value: '50+' },
                  { label: 'Schedules Generated', value: '10k+' }
                ].map((stat) => (
                  <Box key={stat.label}>
                    <Typography variant="h4" fontWeight={800} color="text.primary">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120%',
                  height: '120%',
                  background: theme.palette.mode === 'light'
                    ? 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(255,255,255,0) 70%)'
                    : 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)',
                  zIndex: 0
                }}
              />
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: theme.palette.mode === 'light'
                    ? '0 24px 48px -12px rgba(0, 0, 0, 0.1)'
                    : '0 24px 48px -12px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Abstract UI Representation */}
                <Box sx={{ bgcolor: 'background.paper', p: 3 }}>
                  <Stack spacing={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.main' }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ width: '60%', height: 12, borderRadius: 1, bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'rgba(255,255,255,0.1)', mb: 1 }} />
                        <Box sx={{ width: '40%', height: 8, borderRadius: 1, bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'rgba(255,255,255,0.05)' }} />
                      </Box>
                    </Stack>
                    <Grid container spacing={2}>
                      {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={6} key={i}>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'rgba(255,255,255,0.02)', 
                            border: '1px solid', 
                            borderColor: 'divider' 
                          }}>
                            <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: 'primary.light', mb: 1.5, opacity: 0.2 }} />
                            <Box sx={{ width: '80%', height: 8, borderRadius: 1, bgcolor: theme.palette.mode === 'light' ? 'grey.300' : 'rgba(255,255,255,0.15)', mb: 1 }} />
                            <Box sx={{ width: '50%', height: 6, borderRadius: 1, bgcolor: theme.palette.mode === 'light' ? 'grey.200' : 'rgba(255,255,255,0.1)' }} />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Features Strip */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {[
              { icon: <SpeedRounded />, title: 'Lightning Fast', desc: 'Generate complete schedules in seconds, not days.' },
              { icon: <SecurityRounded />, title: 'Constraint Safe', desc: 'Hard and soft constraints ensure 100% valid outputs.' },
              { icon: <AutoAwesomeRounded />, title: 'AI Powered', desc: 'Genetic algorithms optimize for faculty and student preference.' }
            ].map((feature) => (
              <Grid item xs={12} md={4} key={feature.title}>
                <Stack direction="row" spacing={2}>
                  <Box sx={{ color: 'primary.main' }}>{feature.icon}</Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                      {feature.desc}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;
