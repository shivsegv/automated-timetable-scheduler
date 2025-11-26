import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Alert,
  Chip,
  Collapse,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Checkbox,
  LinearProgress,
  TableSortLabel,
  useTheme,
  alpha,
  ToggleButtonGroup,
  ToggleButton,
  MenuItem
} from '@mui/material';
import {
  SearchRounded,
  RemoveRedEyeOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  RefreshRounded,
  AddRounded,
  EditRounded,
  DeleteOutlineRounded,
  CheckRounded,
  CloseRounded,
  AssessmentOutlined,
  TableRowsRounded,
  UploadFileRounded,
  GroupsRounded,
  PersonRounded,
  MeetingRoomRounded,
  MenuBookRounded
} from '@mui/icons-material';
import timetableService from '../services/api';
import CSVVisualization from './CSVVisualization';
import CSVPreview from './CSVPreview';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import { formatEmail, formatEmailPreview, isValidSectionIdentifier } from '../utils/formatters';

const dataTypes = {
  batches: {
    name: 'Batches',
    singular: 'Batch',
    columns: [
      { key: 'id', label: 'ID', width: 90, editable: false },
      { key: 'batchName', label: 'Batch', minWidth: 180 },
      { key: 'year', label: 'Year', minWidth: 80, type: 'number' },
      { key: 'section', label: 'Section', minWidth: 90 },
      { key: 'studentCount', label: 'Students', minWidth: 120, type: 'number' }
    ]
  },
  faculty: {
    name: 'Faculty',
    singular: 'Faculty record',
    columns: [
      { key: 'id', label: 'ID', width: 90, editable: false },
      { key: 'name', label: 'Instructor', minWidth: 180 },
      { key: 'subjects', label: 'Subjects', minWidth: 200 },
      { key: 'email', label: 'Email', minWidth: 320, noWrap: false },
      { key: 'maxHoursPerDay', label: 'Max Hours / Day', minWidth: 140, type: 'number' }
    ]
  },
  rooms: {
    name: 'Rooms',
    singular: 'Room',
    columns: [
      { key: 'id', label: 'ID', width: 90, editable: false },
      { key: 'roomNumber', label: 'Room Number', minWidth: 140 },
      { key: 'capacity', label: 'Capacity', minWidth: 120, type: 'number' },
      { 
        key: 'roomType', 
        label: 'Room Type', 
        minWidth: 160,
        options: ['LECTURE_ROOM', 'COMPUTER_LAB', 'HARDWARE_LAB', 'SEATER_120', 'SEATER_240']
      }
    ]
  },
  courses: {
    name: 'Courses',
    singular: 'Course',
    columns: [
      { key: 'id', label: 'ID', width: 90, editable: false },
      { key: 'name', label: 'Course Name', minWidth: 200 },
      { key: 'courseCode', label: 'Course Code', minWidth: 140 },
      { key: 'credits', label: 'Credits', minWidth: 110, type: 'number' },
      { 
        key: 'courseType', 
        label: 'Course Type', 
        minWidth: 140,
        options: ['regular', 'elective', 'lab']
      }
    ]
  }
};

// const titleCase = (value = '') =>
//   value
//     .toLowerCase()
//     .split(' ')
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(' ');

const formatCellValue = (key, raw) => {
  if (raw === null || raw === undefined || raw === '') {
    return '—';
  }
  if (Array.isArray(raw)) {
    return raw.join(', ');
  }
  if (key === 'roomType' || key === 'courseType') {
    return raw;
  }
  if (key === 'maxHoursPerDay') {
    return `${raw} hrs/day`;
  }
  if (key === 'email') {
    // Fix issue #21, #66: Prevent email truncation
    return formatEmail(raw);
  }
  return raw;
};

const isYearLikeSection = (value) => /^\d{4}$/.test(String(value ?? '').trim());

const getSectionError = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return 'Enter a section code such as A, B, or DSAI.';
  if (isYearLikeSection(text)) return 'Use section identifiers, not the academic year.';
  if (!isValidSectionIdentifier(text)) return 'Use 1-12 letters/numbers (A, B, C, DSAI, etc.).';
  return '';
};

function CSVManager() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('batches');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [newRow, setNewRow] = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [validationErrors, setValidationErrors] = useState(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  // Fix issue #35, #52: Add confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, title: '', message: '' });
  const [toast, setToast] = useState({ open: false, severity: 'info', message: '' });
  const [typeOptions, setTypeOptions] = useState({ roomTypes: [], courseTypes: [] });

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'background.paper',
      borderRadius: 2,
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
      '&.Mui-focused': {
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
      }
    },
    '& .MuiInputLabel-root': {
      color: 'text.secondary',
      '&.Mui-focused': {
        color: 'primary.main',
        fontWeight: 600
      }
    }
  };

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await timetableService.getMetadataTypes();
        setTypeOptions(response.data);
      } catch (error) {
        console.error("Failed to fetch metadata types", error);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    setSelectedRows([]);
    setEditingRow(null);
    setNewRow({});
  }, [activeTab]);

  const columns = useMemo(() => {
    const cols = dataTypes[activeTab].columns.map(col => ({ ...col }));
    if (activeTab === 'rooms') {
      const typeCol = cols.find(c => c.key === 'roomType');
      if (typeCol && typeOptions.roomTypes?.length > 0) {
        typeCol.options = typeOptions.roomTypes;
      }
    }
    if (activeTab === 'courses') {
      const typeCol = cols.find(c => c.key === 'courseType');
      if (typeCol && typeOptions.courseTypes?.length > 0) {
        typeCol.options = typeOptions.courseTypes;
      }
    }
    return cols;
  }, [activeTab, typeOptions]);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await timetableService.getData(activeTab);
      setData(response.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to load ${dataTypes[activeTab].name}` });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!uploadFile) {
      setMessage({ type: 'error', text: 'Please select a CSV file to upload.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    setLoading(true);
    try {
      const validation = await timetableService.validateCSV(activeTab, formData);
      if (!validation.data.valid) {
        setValidationErrors(validation.data);
        setMessage({ type: 'error', text: 'Validation failed. Review the highlighted issues.' });
        setLoading(false);
        return;
      }
      await timetableService.uploadCSV(activeTab, formData);
      setMessage({ type: 'success', text: `${dataTypes[activeTab].name} uploaded successfully.` });
      setUploadFile(null);
      setShowUpload(false);
      setValidationErrors(null);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await timetableService.downloadCSV(activeTab);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeTab}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to download the CSV.' });
    }
  };

  // Fix issue #35: Add proper confirmation dialog instead of window.confirm
  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete record',
      message: 'Are you sure you want to delete this record? This action cannot be undone.',
      severity: 'error',
      action: async () => {
        setLoading(true);
        try {
          await timetableService.deleteData(activeTab, id);
          setToast({ open: true, severity: 'success', message: 'Record deleted successfully' });
          setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
          loadData();
        } catch (error) {
          setToast({ open: true, severity: 'error', message: 'Failed to delete record' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSave = async () => {
    if (!editingRow) return;
    if (activeTab === 'batches') {
      const sectionIssue = getSectionError(editingRow.section);
      if (sectionIssue) {
        setMessage({ type: 'error', text: sectionIssue });
        return;
      }
    }
    setLoading(true);
    try {
      await timetableService.updateData(activeTab, editingRow.id, editingRow);
      setMessage({ type: 'success', text: 'Record updated.' });
      setEditingRow(null);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const editableColumns = columns.filter((col) => col.editable !== false);
    const missingField = editableColumns.find(
      (column) => column.required !== false && !String(newRow[column.key] ?? '').trim()
    );
    if (missingField) {
      setMessage({ type: 'error', text: `Please provide ${missingField.label}.` });
      return;
    }
    if (activeTab === 'batches') {
      const sectionIssue = getSectionError(newRow.section);
      if (sectionIssue) {
        setMessage({ type: 'error', text: sectionIssue });
        return;
      }
    }
    setLoading(true);
    try {
      await timetableService.addData(activeTab, newRow);
      setMessage({ type: 'success', text: 'Record added.' });
      setNewRow({});
      setIsAdding(false);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to add record.' });
    } finally {
      setLoading(false);
    }
  };

  // Fix issue #52: Add proper confirmation for bulk delete
  const handleBulkDelete = async () => {
    if (!selectedRows.length) return;
    setConfirmDialog({
      open: true,
      title: `Delete ${selectedRows.length} records`,
      message: `Are you sure you want to delete ${selectedRows.length} selected record(s)? This action cannot be undone.`,
      severity: 'error',
      showAlert: true,
      alertMessage: 'All selected records will be permanently removed from the database.',
      action: async () => {
        setLoading(true);
        try {
          await Promise.all(selectedRows.map((rowId) => timetableService.deleteData(activeTab, rowId)));
          setToast({ open: true, severity: 'success', message: `Successfully deleted ${selectedRows.length} record(s)` });
          setSelectedRows([]);
          loadData();
        } catch (error) {
          setToast({ open: true, severity: 'error', message: 'Bulk delete failed' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      key: field,
      direction: prev.key === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (visibleIds) => {
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRows.includes(id));
    if (allVisibleSelected) {
      setSelectedRows((prev) => prev.filter((rowId) => !visibleIds.includes(rowId)));
    } else {
      setSelectedRows((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const resetNewRow = () => setNewRow({});

  const sortedData = useMemo(() => {
    let result = [...data];
    if (searchTerm) {
      result = result.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, searchTerm, sortConfig]);

  const editableColumns = columns.filter((column) => column.editable !== false);
  const visibleIds = sortedData.map((row) => row.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRows.includes(id));
  const isIndeterminate = selectedRows.length > 0 && !allVisibleSelected && visibleIds.some((id) => selectedRows.includes(id));
  const newRowSectionIssue = activeTab === 'batches' ? getSectionError(newRow.section) : '';
  const addDisabled =
    editableColumns.some((column) => column.required !== false && !String(newRow[column.key] ?? '').trim()) ||
    (activeTab === 'batches' && Boolean(newRowSectionIssue));
  const datasetLabel = dataTypes[activeTab].name;
  const expectedColumns = columns.map((column) => column.key).join(', ');
  const noRecords = !loading && data.length === 0;
  const filteredEmpty = !loading && data.length > 0 && sortedData.length === 0;

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            CSV Workspace
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '48ch', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Validate, preview, and edit the datasets that feed the solver.
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
            gap: 2
          }}
        >
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <TableRowsRounded />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block">
              Total Records
            </Typography>
            <Typography variant="h6" fontWeight={700} lineHeight={1}>
              {data.length}
            </Typography>
          </Box>
        </Paper>
      </Stack>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ borderRadius: 2 }}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'visible' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={(_, value) => value && setActiveTab(value)}
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
                mb: { xs: 0.5, sm: 0 },
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
            {Object.entries(dataTypes).map(([key, value]) => {
              const Icon = key === 'batches' ? GroupsRounded : 
                           key === 'faculty' ? PersonRounded :
                           key === 'rooms' ? MeetingRoomRounded : MenuBookRounded;
              return (
                <ToggleButton key={key} value={key}>
                  <Icon fontSize="small" sx={{ mr: 1 }} />
                  {value.name}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={`Search ${datasetLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={inputStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end" flexWrap="wrap">
                <Button
                  startIcon={<AddRounded />}
                  variant="contained"
                  onClick={() => { setIsAdding(true); resetNewRow(); }}
                  disabled={loading || isAdding}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Add
                </Button>
                <Button
                  startIcon={<RemoveRedEyeOutlined />}
                  variant="outlined"
                  onClick={() => setShowPreview(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Preview
                </Button>
                <Button
                  startIcon={<CloudUploadOutlined />}
                  variant={showUpload ? 'contained' : 'outlined'}
                  onClick={() => setShowUpload((prev) => !prev)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Upload
                </Button>
                <Button
                  startIcon={<CloudDownloadOutlined />}
                  variant="outlined"
                  onClick={handleDownload}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Download
                </Button>
                <Button
                  startIcon={<RefreshRounded />}
                  variant="outlined"
                  onClick={loadData}
                  disabled={loading}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Refresh
                </Button>
              </Stack>
            </Grid>
          </Grid>
          <Collapse in={showUpload}>
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 4,
                border: '2px dashed',
                borderColor: 'primary.main',
                bgcolor: 'rgba(59, 130, 246, 0.04)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Stack component="form" spacing={3} alignItems="center" onSubmit={handleUpload}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'primary.main'
                  }}
                >
                  <CloudUploadOutlined fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Upload {dataTypes[activeTab].name} CSV
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a .csv file to update the dataset.
                  </Typography>
                </Box>
                
                <Button
                  component="label"
                  variant="outlined"
                  size="large"
                  startIcon={<UploadFileRounded />}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  Choose File
                  <input
                    type="file"
                    hidden
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                  />
                </Button>
                
                {uploadFile && (
                  <Chip 
                    label={uploadFile.name} 
                    onDelete={() => setUploadFile(null)} 
                    color="primary" 
                    variant="filled" 
                  />
                )}

                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained" disabled={!uploadFile || loading} size="large">
                    {loading ? 'Uploading…' : 'Upload file'}
                  </Button>
                  <Button variant="text" onClick={() => setShowUpload(false)}>
                    Cancel
                  </Button>
                </Stack>
                
                <Alert severity="info" icon={false} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', maxWidth: 600 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    Expected columns: {expectedColumns}
                  </Typography>
                </Alert>
              </Stack>
            </Paper>
          </Collapse>
        </CardContent>
      </Card>

      {validationErrors && !validationErrors.valid && (
        <Alert severity="warning">
          <Stack spacing={1}>
            <Typography variant="subtitle2">Validation issues</Typography>
            {validationErrors.errors?.map((err, idx) => (
              <Typography key={`err-${idx}`} variant="body2">{err}</Typography>
            ))}
            {validationErrors.warnings?.map((warn, idx) => (
              <Typography key={`warn-${idx}`} variant="body2">{warn}</Typography>
            ))}
          </Stack>
        </Alert>
      )}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mb: 4
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<TableRowsRounded fontSize="small" />}
                  label={`${sortedData.length} visible`}
                  color="primary"
                  variant="filled"
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  of {data.length} total
                </Typography>
                {selectedRows.length > 0 && (
                  <Chip label={`${selectedRows.length} selected`} color="secondary" variant="filled" size="small" />
                )}
                {searchTerm && (
                  <Chip 
                    label={`Filtered: "${searchTerm}"`} 
                    onDelete={() => setSearchTerm('')}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button
                  startIcon={<AssessmentOutlined />}
                  variant={showVisualization ? 'contained' : 'outlined'}
                  onClick={() => setShowVisualization((prev) => !prev)}
                  disabled={!data.length}
                  size="small"
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  {showVisualization ? 'Hide Analytics' : 'Analytics'}
                </Button>
                <Button
                  startIcon={<DeleteOutlineRounded />}
                  variant="outlined"
                  color="error"
                  disabled={!selectedRows.length || loading}
                  onClick={handleBulkDelete}
                  size="small"
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Delete Selected
                </Button>
              </Stack>
            </Stack>
          </Box>

          {loading ? (
            <Box py={8} textAlign="center">
              <LinearProgress sx={{ width: { xs: '90%', md: '40%' }, mx: 'auto', borderRadius: 999, height: 6 }} />
              <Typography variant="body2" color="text.secondary" mt={3} fontWeight={500}>
                Loading {datasetLabel.toLowerCase()}...
              </Typography>
            </Box>
          ) : filteredEmpty ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No records match "{searchTerm}".
              </Typography>
              <Button variant="text" onClick={() => setSearchTerm('')} sx={{ mt: 1 }}>
                Clear Search
              </Button>
            </Box>
          ) : noRecords ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No {datasetLabel.toLowerCase()} found.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Upload a CSV or add a new record below.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ bgcolor: 'background.paper', borderBottom: '2px solid', borderColor: 'divider' }}>
                      <Checkbox
                        color="primary"
                        indeterminate={isIndeterminate}
                        checked={allVisibleSelected && visibleIds.length > 0}
                        onChange={() => toggleSelectAll(visibleIds)}
                        inputProps={{ 'aria-label': 'Select all visible rows' }}
                        size="small"
                        sx={{ color: 'text.disabled' }}
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={{ 
                          minWidth: column.minWidth, 
                          width: column.width, 
                          bgcolor: 'background.paper',
                          borderBottom: '2px solid',
                          borderColor: 'divider',
                          fontWeight: 700,
                          color: 'text.primary',
                          py: 2,
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em'
                        }}
                      >
                        <TableSortLabel
                          active={sortConfig.key === column.key}
                          direction={sortConfig.key === column.key ? sortConfig.direction : 'asc'}
                          onClick={() => handleSort(column.key)}
                          sx={{ 
                            '&.Mui-active': { color: 'primary.main' },
                            '&:hover': { color: 'text.primary' }
                          }}
                        >
                          {column.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell 
                      align="right"
                      sx={{ 
                        bgcolor: 'background.paper',
                        borderBottom: '2px solid',
                        borderColor: 'divider',
                        fontWeight: 700,
                        color: 'text.primary',
                        py: 2,
                        width: 120,
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isAdding && (
                    <TableRow
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        '& td': { borderBottom: '2px solid', borderColor: 'primary.main' }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox disabled size="small" />
                      </TableCell>
                      {columns.map((column) => {
                        const isSectionColumn = column.key === 'section' && activeTab === 'batches';
                        const showHelper = isSectionColumn && Boolean(newRow[column.key]);
                        return (
                          <TableCell key={`new-${column.key}`} sx={{ py: 2, verticalAlign: 'top' }}>
                            {column.editable !== false ? (
                              <TextField
                                select={Boolean(column.options)}
                                fullWidth
                                placeholder={column.label}
                                type={column.type || 'text'}
                                value={newRow[column.key] ?? ''}
                                onChange={(e) => setNewRow({ ...newRow, [column.key]: e.target.value })}
                                required={column.required !== false}
                                error={isSectionColumn && showHelper && Boolean(newRowSectionIssue)}
                                helperText={isSectionColumn && showHelper ? newRowSectionIssue : undefined}
                                size="small"
                                autoFocus={column.key === columns.find(c => c.editable !== false)?.key}
                                sx={{
                                  ...inputStyles,
                                  '& .MuiInputBase-root': { bgcolor: 'background.paper' }
                                }}
                              >
                                {column.options?.map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </TextField>
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="right" sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              onClick={handleAdd}
                              disabled={addDisabled || loading}
                              sx={{ 
                                color: 'success.main',
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                              }}
                            >
                              <CheckRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              onClick={() => { setIsAdding(false); resetNewRow(); }}
                              sx={{ 
                                color: 'error.main',
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                              }}
                            >
                              <CloseRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                  {sortedData.map((row) => {
                    const isSelected = selectedRows.includes(row.id);
                    const isEditing = editingRow && editingRow.id === row.id;
                    
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        selected={isSelected}
                        sx={{
                          transition: 'all 0.2s ease',
                          bgcolor: isEditing ? alpha(theme.palette.primary.main, 0.02) : 'inherit',
                          '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                          '&.Mui-selected:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' }
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Checkbox
                            color="primary"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(row.id)}
                            size="small"
                            sx={{ color: 'text.disabled' }}
                          />
                        </TableCell>
                        {columns.map((column) => {
                          const isEditable = column.editable !== false;
                          const isEmailColumn = column.key === 'email';
                          const isSectionColumn = column.key === 'section';
                          const rawValue = row[column.key];
                          const cellValue = formatCellValue(column.key, rawValue);
                          const displayValue = isEmailColumn ? formatEmailPreview(rawValue, 34) : cellValue;
                          const tooltipLabel = isEmailColumn ? formatEmail(rawValue) : cellValue;
                          const shouldTruncate = !isEmailColumn && column.noWrap !== false && Boolean(column.minWidth && column.minWidth >= 180);
                          const sectionNeedsAttention = isSectionColumn && Boolean(rawValue) && isYearLikeSection(rawValue);
                          const editingError = isEditing && isSectionColumn ? getSectionError(editingRow?.section) : '';

                          return (
                            <TableCell
                              key={`${row.id}-${column.key}`}
                              sx={{
                                minWidth: column.minWidth,
                                width: column.width,
                                verticalAlign: 'top',
                                py: 2,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                color: 'text.secondary',
                                fontSize: '0.9rem'
                              }}
                            >
                              {isEditing && isEditable ? (
                                <TextField
                                  select={Boolean(column.options)}
                                  size="small"
                                  type={column.type || 'text'}
                                  value={editingRow[column.key] ?? ''}
                                  onChange={(e) => setEditingRow({ ...editingRow, [column.key]: e.target.value })}
                                  fullWidth
                                  error={Boolean(editingError)}
                                  helperText={editingError || ''}
                                  sx={{
                                    ...inputStyles,
                                    '& .MuiInputBase-root': {
                                      bgcolor: 'background.paper'
                                    }
                                  }}
                                >
                                  {column.options?.map((option) => (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              ) : (
                                <Stack spacing={0.5}>
                                  {(() => {
                                    const textNode = (
                                      <Typography
                                        variant="body2"
                                        color={sectionNeedsAttention ? 'warning.main' : 'text.primary'}
                                        noWrap={shouldTruncate && !isEmailColumn}
                                        sx={{
                                          wordBreak: column.noWrap === false ? 'break-word' : 'normal',
                                          fontWeight: isSectionColumn ? 600 : 400,
                                          fontFamily: isEmailColumn ? '"IBM Plex Mono", monospace' : 'inherit'
                                        }}
                                      >
                                        {displayValue}
                                      </Typography>
                                    );

                                    return (shouldTruncate || isEmailColumn) ? (
                                      <Tooltip title={tooltipLabel} arrow placement="top">
                                        <Box component="span" sx={{ display: 'inline-block', maxWidth: '100%' }}>
                                          {textNode}
                                        </Box>
                                      </Tooltip>
                                    ) : (
                                      textNode
                                    );
                                  })()}
                                  {sectionNeedsAttention && (
                                    <Chip
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      label="Check Format"
                                      sx={{ height: 20, fontSize: '0.65rem' }}
                                    />
                                  )}
                                </Stack>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {isEditing ? (
                              <>
                                <Tooltip title="Save">
                                  <IconButton
                                    size="small"
                                    onClick={handleSave}
                                    sx={{ 
                                      color: 'success.main',
                                      bgcolor: alpha(theme.palette.success.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                                    }}
                                  >
                                    <CheckRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                  <IconButton
                                    size="small"
                                    onClick={() => setEditingRow(null)}
                                    sx={{ 
                                      color: 'error.main',
                                      bgcolor: alpha(theme.palette.error.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                    }}
                                  >
                                    <CloseRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => setEditingRow(row)}
                                    disabled={loading || editingRow !== null}
                                    sx={{ 
                                      color: 'text.secondary',
                                      transition: 'all 0.2s',
                                      '&:hover': { 
                                        color: 'primary.main',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        transform: 'translateY(-1px)'
                                      }
                                    }}
                                  >
                                    <EditRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(row.id)}
                                    disabled={loading || editingRow !== null}
                                    sx={{ 
                                      color: 'text.secondary',
                                      transition: 'all 0.2s',
                                      '&:hover': { 
                                        color: 'error.main',
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        transform: 'translateY(-1px)'
                                      }
                                    }}
                                  >
                                    <DeleteOutlineRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Add New Form Removed - Integrated into Table */}
        </CardContent>
      </Card>

      <CSVPreview csvType={activeTab} open={showPreview} onClose={() => setShowPreview(false)} />

      {showVisualization && data.length > 0 && (
        <CSVVisualization csvType={activeTab} data={data} />
      )}

      {/* Fix issue #35, #52: Add confirmation dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        severity={confirmDialog.severity || 'warning'}
        showAlert={confirmDialog.showAlert}
        alertMessage={confirmDialog.alertMessage}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Fix issue #97: Add toast notifications */}
      <Toast
        open={toast.open}
        onClose={() => setToast({ ...toast, open: false })}
        severity={toast.severity}
        message={toast.message}
      />
    </Stack>
  );
}

export default CSVManager;
