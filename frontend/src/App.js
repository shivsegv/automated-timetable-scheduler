import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles,
  Box,
  Drawer,
  Toolbar,
  AppBar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Avatar,
  Button,
  Breadcrumbs,
  Tooltip
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  MenuRounded,
  DashboardOutlined,
  CalendarMonthOutlined,
  AccessTimeOutlined,
  SchemaOutlined,
  Groups2Outlined,
  SchoolOutlined,
  MeetingRoomOutlined,
  CloudUploadOutlined,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import './App.css';
import Dashboard from './components/Dashboard';
import TimetableView from './components/TimetableView';
import FacultyView from './components/FacultyView';
import RoomView from './components/RoomView';
import BatchView from './components/BatchView';
import CSVManager from './components/CSVManager';
import TimeSlotConfig from './components/TimeSlotConfig';
import BatchYearMapping from './components/BatchYearMapping';
import LandingPage from './components/LandingPage';

const drawerWidth = 256;
const fontStack = '"Inter var", "Inter", "Soehne", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: '#0f172a', // Slate 900
            light: '#334155', // Slate 700
            dark: '#020617', // Slate 950
            contrastText: '#ffffff'
          },
          secondary: {
            main: '#6366f1', // Indigo 500
            light: '#818cf8',
            dark: '#4f46e5',
            contrastText: '#ffffff'
          },
          success: {
            main: '#10b981', // Emerald 500
            light: '#34d399',
            dark: '#059669',
            contrastText: '#ffffff'
          },
          warning: {
            main: '#f59e0b', // Amber 500
            light: '#fbbf24',
            dark: '#d97706',
            contrastText: '#ffffff'
          },
          error: {
            main: '#ef4444', // Red 500
            light: '#f87171',
            dark: '#b91c1c',
            contrastText: '#ffffff'
          },
          info: {
            main: '#3b82f6', // Blue 500
            light: '#60a5fa',
            dark: '#2563eb',
            contrastText: '#ffffff'
          },
          divider: 'rgba(226, 232, 240, 0.8)', // Slate 200 with opacity
          grey: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a'
          },
          background: {
            default: '#f8fafc', // Slate 50
            paper: '#ffffff'
          },
          text: {
            primary: '#0f172a', // Slate 900
            secondary: '#64748b', // Slate 500
            disabled: '#94a3b8' // Slate 400
          },
          action: {
            active: '#64748b',
            hover: 'rgba(15, 23, 42, 0.04)',
            selected: 'rgba(99, 102, 241, 0.08)', // Indigo tint
            disabled: 'rgba(148, 163, 184, 0.3)',
            disabledBackground: 'rgba(148, 163, 184, 0.12)'
          }
        }
      : {
          // Premium Dark Mode Palette
          primary: {
            main: '#818cf8', // Soft Indigo
            light: '#a5b4fc',
            dark: '#6366f1',
            contrastText: '#ffffff'
          },
          secondary: {
            main: '#c084fc', // Soft Purple
            light: '#d8b4fe',
            dark: '#a855f7',
            contrastText: '#ffffff'
          },
          success: {
            main: '#34d399', // Soft Emerald
            light: '#6ee7b7',
            dark: '#10b981',
            contrastText: '#0f172a'
          },
          warning: {
            main: '#fbbf24', // Soft Amber
            light: '#fcd34d',
            dark: '#f59e0b',
            contrastText: '#0f172a'
          },
          error: {
            main: '#f87171', // Soft Red
            light: '#fca5a5',
            dark: '#ef4444',
            contrastText: '#0f172a'
          },
          info: {
            main: '#60a5fa', // Soft Blue
            light: '#93c5fd',
            dark: '#3b82f6',
            contrastText: '#0f172a'
          },
          divider: 'rgba(255, 255, 255, 0.08)', // Very subtle divider
          grey: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a'
          },
          background: {
            default: '#000000', // Pure Black for maximum contrast and premium feel
            paper: '#0A0A0A' // Almost black for cards
          },
          text: {
            primary: '#EDEDED', // High legibility off-white
            secondary: '#A1A1AA', // Neutral grey
            disabled: '#52525B'
          },
          action: {
            active: '#EDEDED',
            hover: 'rgba(255, 255, 255, 0.08)',
            selected: 'rgba(255, 255, 255, 0.12)',
            disabled: 'rgba(255, 255, 255, 0.3)',
            disabledBackground: 'rgba(255, 255, 255, 0.12)'
          }
        })
  },
  shape: {
    borderRadius: 16 // More rounded for modern feel
  },
  shadows: mode === 'light' ? [
    'none',
    '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 1px 2px -1px rgba(0,0,0,0.04)',
    '0px 4px 6px -1px rgba(0,0,0,0.08), 0px 2px 4px -1px rgba(0,0,0,0.04)',
    '0px 8px 12px -3px rgba(0,0,0,0.08), 0px 4px 6px -2px rgba(0,0,0,0.04)',
    '0px 12px 16px -4px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)',
    '0px 20px 25px -5px rgba(0,0,0,0.1), 0px 10px 10px -5px rgba(0,0,0,0.04)',
    ...Array(19).fill('none')
  ] : [
    'none',
    '0 0 0 1px rgba(255,255,255,0.1)', // Subtle border
    '0 0 0 1px rgba(255,255,255,0.1), 0 4px 6px -1px rgba(0,0,0,0.5)',
    '0 0 0 1px rgba(255,255,255,0.1), 0 10px 15px -3px rgba(0,0,0,0.5)',
    '0 0 0 1px rgba(255,255,255,0.1), 0 20px 25px -5px rgba(0,0,0,0.5)',
    '0 0 0 1px rgba(255,255,255,0.1), 0 25px 50px -12px rgba(0,0,0,0.5)',
    ...Array(19).fill('none')
  ],
  typography: {
    fontFamily: fontStack,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
      fontWeight: 800,
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
      color: mode === 'light' ? '#0f172a' : '#f8fafc'
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
      color: mode === 'light' ? '#0f172a' : '#f8fafc'
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.3,
      color: mode === 'light' ? '#0f172a' : '#f8fafc'
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      lineHeight: 1.4,
      color: mode === 'light' ? '#1e293b' : '#e2e8f0'
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.015em',
      lineHeight: 1.5,
      color: mode === 'light' ? '#1e293b' : '#e2e8f0'
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.5,
      color: mode === 'light' ? '#1e293b' : '#e2e8f0'
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: mode === 'light' ? '#475569' : '#94a3b8',
      lineHeight: 1.6,
      letterSpacing: '-0.01em'
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: mode === 'light' ? '#64748b' : '#94a3b8',
      letterSpacing: '0.01em',
      lineHeight: 1.5
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: mode === 'light' ? '#334155' : '#cbd5e1',
      letterSpacing: '-0.01em'
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: mode === 'light' ? '#475569' : '#94a3b8',
      letterSpacing: '-0.005em'
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
      fontSize: '0.875rem'
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: mode === 'light' ? '#64748b' : '#94a3b8',
      letterSpacing: '0.02em'
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: mode === 'light' ? '#64748b' : '#94a3b8',
      lineHeight: 1.5
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a',
          color: mode === 'light' ? '#0f172a' : '#f8fafc'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          paddingInline: theme.spacing(2.5),
          paddingBlock: theme.spacing(1),
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          },
          ...(ownerState.variant === 'contained' && {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
            }
          }),
          ...(ownerState.variant === 'outlined' && {
            borderWidth: 1.5,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              backgroundColor: 'transparent'
            }
          }),
          ...(ownerState.variant === 'text' && {
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[800],
              color: theme.palette.text.primary
            }
          })
        })
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          '&.MuiPaper-elevation1': {
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.02)'
              : '0 1px 3px 0 rgb(0 0 0 / 0.2), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: `1px solid ${theme.palette.divider}`
          },
          '&.MuiPaper-elevation0': {
            border: `1px solid ${theme.palette.divider}`
          },
          '&.MuiPaper-rounded': {
            borderRadius: 16
          }
        })
      }
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: mode === 'light' 
            ? '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.02)'
            : '0 1px 3px 0 rgb(0 0 0 / 0.2), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light'
              ? '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -2px rgb(0 0 0 / 0.025)'
              : '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
            borderColor: mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700]
          }
        })
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 32,
          '&:last-child': { paddingBottom: 32 }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 600,
          borderRadius: 8,
          backgroundColor: mode === 'light' ? theme.palette.grey[100] : 'rgba(255, 255, 255, 0.08)',
          color: theme.palette.text.secondary,
          border: 'none',
          '&.MuiChip-colorPrimary': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: alpha(theme.palette.success.main, 0.08),
            color: theme.palette.success.main
          },
          '&.MuiChip-outlined': {
            backgroundColor: 'transparent',
            border: `1px solid ${theme.palette.divider}`
          }
        })
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          marginBlock: 4,
          paddingBlock: 10,
          paddingInline: 16,
          color: theme.palette.text.secondary,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08)
            },
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main
            }
          },
          '&:hover': {
            backgroundColor: mode === 'light' ? theme.palette.grey[50] : 'rgba(255, 255, 255, 0.05)',
            color: theme.palette.text.primary,
            '& .MuiListItemIcon-root': {
              color: theme.palette.text.primary
            }
          }
        })
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: 'inherit'
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          minHeight: 48,
          paddingInline: 24
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& th': {
            backgroundColor: mode === 'light' ? theme.palette.grey[50] : '#0A0A0A',
            color: theme.palette.text.secondary,
            fontWeight: 600,
            borderBottom: `1px solid ${theme.palette.divider}`,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em'
          }
        })
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${mode === 'light' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)'}`,
          paddingBlock: 16
        },
        head: {
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: mode === 'light' ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          color: theme.palette.text.secondary,
          '&:hover': {
            backgroundColor: mode === 'light' ? theme.palette.grey[100] : 'rgba(255, 255, 255, 0.05)',
            color: theme.palette.text.primary
          }
        })
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor: mode === 'light' ? '#ffffff' : 'transparent',
          '& fieldset': {
            borderColor: theme.palette.divider
          },
          '&:hover fieldset': {
            borderColor: theme.palette.text.secondary
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
            borderWidth: 2
          }
        }),
        input: {
          paddingBlock: 14
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.95rem'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
        }
      }
    }
  }
});

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlined /> },
  { label: 'Timetable', path: '/timetable', icon: <CalendarMonthOutlined /> },
  { label: 'CSV Manager', path: '/csv-manager', icon: <CloudUploadOutlined /> },
  { label: 'Time Slots', path: '/timeslots', icon: <AccessTimeOutlined /> },
  { label: 'Batch Mapping', path: '/batch-mapping', icon: <SchemaOutlined /> },
  { label: 'Batches', path: '/batches', icon: <Groups2Outlined /> },
  { label: 'Faculty', path: '/faculty', icon: <SchoolOutlined /> },
  { label: 'Rooms', path: '/rooms', icon: <MeetingRoomOutlined /> }
];

function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeNavItem = navItems.find((item) => item.path === location.pathname);
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ px: 3, py: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
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
        <Box>
          <Typography variant="h6" fontWeight={800} lineHeight={1.2} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
            Atlas
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Scheduler v2.4
          </Typography>
        </Box>
      </Box>

      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={selected}
              aria-current={selected ? 'page' : undefined}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                px: 2.5,
                py: 1.5,
                gap: 2,
                color: selected ? 'primary.main' : 'text.secondary',
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: selected ? alpha(theme.palette.primary.main, 0.12) : 'action.hover',
                  color: selected ? 'primary.main' : 'text.primary',
                  transform: 'translateX(4px)'
                },
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                }
              }}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: 24, 
                  color: selected ? 'primary.main' : 'inherit',
                  transition: 'color 0.2s'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: selected ? 700 : 500,
                  fontSize: '0.9rem'
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 3, py: 3 }}>
        <Stack spacing={2}>
          <Button
            component={RouterLink}
            to="/csv-manager"
            variant="contained"
            size="large"
            fullWidth
            startIcon={<CloudUploadOutlined />}
            sx={{ 
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.2)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            New Schedule
          </Button>
          
          <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 2, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText', 
                width: 40, 
                height: 40,
                fontSize: '0.875rem',
                fontWeight: 700
              }}
            >
              SC
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary' }}>
                Scheduler Core
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', boxShadow: '0 0 0 2px white' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Online
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Skip Navigation Link for Accessibility (Issue #102) */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 9999,
          padding: 2,
          backgroundColor: 'primary.main',
          color: 'white',
          textDecoration: 'none',
          borderRadius: 2,
          '&:focus': {
            left: '10px',
            top: '10px'
          }
        }}
      >
        Skip to main content
      </Box>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="Main navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              borderRight: 'none'
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              borderRight: 'none'
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : alpha(theme.palette.background.default, 0.8),
            backdropFilter: 'blur(12px)'
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 64, md: 80 } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title="Open navigation menu" arrow>
                <IconButton
                  color="inherit"
                  aria-label="Open navigation menu"
                  edge="start"
                  onClick={() => setMobileOpen(true)}
                  sx={{ display: { md: 'none' } }}
                >
                  <MenuRounded />
                </IconButton>
              </Tooltip>
              <Stack spacing={0.5}>
                {activeNavItem && location.pathname !== '/dashboard' && (
                  <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ fontSize: '0.85rem', '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}>
                    <Typography component={RouterLink} to="/dashboard" color="text.secondary" sx={{ textDecoration: 'none', transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}>
                      Dashboard
                    </Typography>
                    <Typography color="text.primary" fontWeight={600}>
                      {activeNavItem.label}
                    </Typography>
                  </Breadcrumbs>
                )}
                <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                  {activeNavItem ? activeNavItem.label : 'Operations Console'}
                </Typography>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
              <Tooltip
                title="Solver API Status: All scheduling services are operational and responding normally"
                arrow
                placement="bottom"
              >
                <Stack 
                  direction="row" 
                  spacing={1} 
                  alignItems="center" 
                  sx={{ 
                    px: 1.5, 
                    py: 0.75, 
                    borderRadius: 999, 
                    bgcolor: 'rgba(16, 185, 129, 0.1)', 
                    color: 'success.main',
                    border: '1px solid',
                    borderColor: 'rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor' }} aria-hidden />
                  <Typography variant="caption" fontWeight={700}>
                    Solver Online
                  </Typography>
                </Stack>
              </Tooltip>
              <Button 
                component={RouterLink} 
                to="/timetable" 
                variant="outlined" 
                color="inherit"
                sx={{ borderColor: 'divider' }}
              >
                View Timetable
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box 
          component="main" 
          id="main-content"
          className="app-shell" 
          sx={{ flexGrow: 1, width: '100%', maxWidth: 1440, mx: 'auto', pb: 6 }}
          tabIndex={-1}
        >
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/timetable" element={<TimetableView />} />
            <Route path="/csv-manager" element={<CSVManager />} />
            <Route path="/timeslots" element={<TimeSlotConfig />} />
            <Route path="/batch-mapping" element={<BatchYearMapping />} />
            <Route path="/faculty" element={<FacultyView />} />
            <Route path="/rooms" element={<RoomView />} />
            <Route path="/batches" element={<BatchView />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const [mode, setMode] = React.useState('light');
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={(theme) => ({
            ':root': {
              '--app-nav-width': `${drawerWidth}px`
            },
            '.app-shell': {
              paddingLeft: `clamp(${theme.spacing(3)}, 4vw, ${theme.spacing(7)})`,
              paddingRight: `clamp(${theme.spacing(3)}, 4vw, ${theme.spacing(7)})`,
              paddingTop: `clamp(${theme.spacing(2)}, 3vw, ${theme.spacing(4)})`
            }
          })}
        />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
