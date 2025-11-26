import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress
} from '@mui/material';
import timetableService from '../services/api';

function CSVPreview({ csvType, open = false, onClose }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(10);

  useEffect(() => {
    if (open) {
      loadPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvType, rowCount, open]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const response = await timetableService.getCSVPreview(csvType, rowCount);
      setPreview(response.data);
    } catch (error) {
      console.error('Failed to load preview', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="h6">CSV Preview · {csvType}</Typography>
          <Typography variant="body2" color="text.secondary">
            {preview ? `Showing ${preview.data?.length || 0} of ${preview.totalRows || 0} rows` : 'Loading data snapshot'}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2">Rows to display</Typography>
            <Select size="small" value={rowCount} onChange={(e) => setRowCount(Number(e.target.value))}>
              {[5, 10, 25, 50, 100].map((count) => (
                <MenuItem key={count} value={count}>
                  {count} rows
                </MenuItem>
              ))}
            </Select>
          </Stack>

          {loading ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress />
            </Stack>
          ) : preview ? (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    {preview.headers?.map((header, idx) => (
                      <TableCell key={`${header}-${idx}`}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.data?.map((row, rowIdx) => (
                    <TableRow key={`preview-row-${rowIdx}`}>
                      <TableCell>{rowIdx + 1}</TableCell>
                      {row.map((cell, cellIdx) => (
                        <TableCell key={`cell-${rowIdx}-${cellIdx}`}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Preview not available.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CSVPreview;
