import React, { useMemo } from 'react';
import {
  Grid,
  Typography,
  Box,
  useTheme,
  Paper,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  DataUsage,
  TableChart,
  CheckCircleOutline,
  WarningAmber
} from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function CSVVisualization({ csvType, data = [] }) {
  const theme = useTheme();

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const totalRows = data.length;
    const totalCells = totalRows * columns.length;
    
    let nullCount = 0;
    const columnStats = {};

    columns.forEach(col => {
      const values = data.map(row => row[col]);
      const uniqueValues = new Set(values).size;
      const colNulls = values.filter(v => v === null || v === undefined || v === '').length;
      nullCount += colNulls;
      
      // Frequency map for categorical data
      const frequency = {};
      values.forEach(v => {
        const key = String(v);
        frequency[key] = (frequency[key] || 0) + 1;
      });

      columnStats[col] = {
        uniqueValues,
        nullCount: colNulls,
        fillRate: ((totalRows - colNulls) / totalRows) * 100,
        frequency
      };
    });

    const completeness = ((totalCells - nullCount) / totalCells) * 100;

    return {
      totalRows,
      totalColumns: columns.length,
      completeness,
      columnStats,
      columns
    };
  }, [data]);

  if (!stats) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="text.secondary">No data available for visualization</Typography>
      </Box>
    );
  }

  const renderCustomChart = () => {
    switch (csvType) {
      case 'courses':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard title="Course Types Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.columnStats['courseType']?.frequency || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {Object.entries(stats.columnStats['courseType']?.frequency || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <ChartCard title="Credits Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(stats.columnStats['credits']?.frequency || {}).map(([name, value]) => ({ name: `${name} Credits`, value }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        );
      case 'rooms':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard title="Room Types">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.columnStats['roomType']?.frequency || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {Object.entries(stats.columnStats['roomType']?.frequency || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <ChartCard title="Capacity Distribution">
                 <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={data.map(r => ({ name: r.roomNumber, capacity: r.capacity })).sort((a, b) => a.capacity - b.capacity)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="capacity" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        );
      case 'faculty':
        return (
           <Grid container spacing={3}>
            <Grid item xs={12}>
              <ChartCard title="Workload Limits (Max Hours/Day)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(stats.columnStats['maxHoursPerDay']?.frequency || {}).map(([name, value]) => ({ name: `${name} Hours`, value }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        );
      case 'batches':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard title="Students per Batch">
                 <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.map(r => ({ name: r.batchName, students: r.studentCount })).slice(0, 20)} // Limit to 20 for readability
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="students" fill="#00C49F" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
             <Grid item xs={12} md={6}>
              <ChartCard title="Batches by Year">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.columnStats['year']?.frequency || {}).map(([name, value]) => ({ name: `Year ${name}`, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {Object.entries(stats.columnStats['year']?.frequency || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Stack spacing={3}>
      {/* Key Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Rows"
            value={stats.totalRows}
            icon={<TableChart color="primary" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Columns"
            value={stats.totalColumns}
            icon={<ViewColumnIcon />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Data Points"
            value={stats.totalRows * stats.totalColumns}
            icon={<DataUsage color="success" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completeness"
            value={`${stats.completeness.toFixed(1)}%`}
            icon={stats.completeness > 90 ? <CheckCircleOutline color="success" /> : <WarningAmber color="warning" />}
            color={stats.completeness > 90 ? "success.main" : "warning.main"}
          />
        </Grid>
      </Grid>

      {/* Custom Charts based on Type */}
      {renderCustomChart()}

      {/* Data Quality Overview */}
      <ChartCard title="Data Quality (Fill Rate per Column)">
        <Stack spacing={2}>
          {stats.columns.map(col => (
            <Box key={col}>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">{col}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.columnStats[col].fillRate.toFixed(1)}% Filled
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={stats.columnStats[col].fillRate}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    bgcolor: stats.columnStats[col].fillRate > 90 ? 'success.main' : 'warning.main'
                  }
                }}
              />
            </Box>
          ))}
        </Stack>
      </ChartCard>
    </Stack>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: (theme) => theme.palette.action.hover,
          display: 'flex'
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ color: color }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

function ChartCard({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%'
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight={600}>
        {title}
      </Typography>
      <Box mt={2}>
        {children}
      </Box>
    </Paper>
  );
}

function ViewColumnIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default CSVVisualization;

