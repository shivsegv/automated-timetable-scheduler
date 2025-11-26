import axios from 'axios';

// Use environment variable for API URL, fallback to relative path for local dev
const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const timetableService = {
  getTimetable: () => api.get('/timetable'),
  generateTimetable: (config) => api.post('/timetable/generate', config),
  getTimetableByBatch: (batchId) => api.get(`/timetable/batch/${batchId}`),
  getTimetableByFaculty: (facultyId) => api.get(`/timetable/faculty/${facultyId}`),
  getTimetableByRoom: (roomId) => api.get(`/timetable/room/${roomId}`),
  getFaculty: () => api.get('/faculty'),
  getRooms: () => api.get('/rooms'),
  getBatches: () => api.get('/batches'),
  getCourses: () => api.get('/courses'),
  
  // Solver configuration endpoints
  getSolverConfig: () => api.get('/solver/config'),
  updateSolverConfig: (config) => api.post('/solver/config', config),
  
  // Time slot configuration endpoints
  getTimeSlotConfig: () => api.get('/timeslots/config'),
  updateTimeSlotConfig: (config) => api.post('/timeslots/config', config),
  resetTimeSlotConfig: () => api.post('/timeslots/config/reset'),
  
  // Batch-year mapping endpoints
  getBatchYearMapping: () => api.get('/batch-year-mapping'),
  updateBatchYearMapping: (mapping) => api.post('/batch-year-mapping', mapping),
  addBatchYearMapping: (yearIdentifier, yearLevel) => 
    api.post('/batch-year-mapping/add', { yearIdentifier, yearLevel }),
  removeBatchYearMapping: (yearIdentifier) => 
    api.delete(`/batch-year-mapping/${yearIdentifier}`),
  
  // CSV Management endpoints
  getData: (type) => api.get(`/${type}`),
  uploadCSV: (type, formData) => {
    return axios.post(`${API_BASE_URL}/${type}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadCSV: (type) => api.get(`/${type}/download`, {
    responseType: 'text',
  }),
  updateData: (type, id, data) => api.put(`/${type}/${id}`, data),
  deleteData: (type, id) => api.delete(`/${type}/${id}`),
  addData: (type, data) => api.post(`/${type}`, data),
  
  // Enhanced CSV endpoints
  getMetadataTypes: () => api.get('/metadata/types'),
  getCSVMetadata: (type) => api.get(`/${type}/metadata`),
  getCSVStatistics: (type) => api.get(`/${type}/statistics`),
  getCSVPreview: (type, rows = 10) => api.get(`/${type}/preview?rows=${rows}`),
  validateCSV: (type, formData) => {
    return axios.post(`${API_BASE_URL}/${type}/validate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default timetableService;
