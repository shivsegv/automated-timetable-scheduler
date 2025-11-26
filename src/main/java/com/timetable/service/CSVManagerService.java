package com.timetable.service;

import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import com.timetable.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class CSVManagerService {
    private static final Logger logger = Logger.getLogger(CSVManagerService.class.getName());
    private static final String CSV_DIR = "./";
    
    // CSV File Metadata
    public Map<String, Object> getCSVMetadata(String csvType) {
        Map<String, Object> metadata = new HashMap<>();
        String fileName = getFileName(csvType);
        Path path = Paths.get(CSV_DIR, fileName);
        
        try {
            if (Files.exists(path)) {
                metadata.put("fileName", fileName);
                metadata.put("fileSize", Files.size(path));
                metadata.put("lastModified", Files.getLastModifiedTime(path).toMillis());
                metadata.put("exists", true);
                metadata.put("rowCount", countRows(path));
                metadata.put("columns", getColumnNames(path));
            } else {
                metadata.put("exists", false);
                metadata.put("message", "File not found");
            }
        } catch (IOException e) {
            logger.severe("Error reading metadata: " + e.getMessage());
            metadata.put("error", e.getMessage());
        }
        
        return metadata;
    }
    
    // Validate CSV Structure
    public Map<String, Object> validateCSV(String csvType, MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> rows = reader.readAll();
            
            if (rows.isEmpty()) {
                errors.add("CSV file is empty");
                result.put("valid", false);
            } else {
                String[] headers = rows.get(0);
                Set<String> expectedHeaders = getExpectedHeaders(csvType);
                
                // Check headers
                Set<String> actualHeaders = new HashSet<>(Arrays.asList(headers));
                for (String expected : expectedHeaders) {
                    if (!actualHeaders.contains(expected)) {
                        errors.add("Missing required column: " + expected);
                    }
                }
                
                // Check data rows
                for (int i = 1; i < rows.size(); i++) {
                    String[] row = rows.get(i);
                    if (row.length != headers.length) {
                        warnings.add("Row " + (i + 1) + " has mismatched column count");
                    }
                }
                
                result.put("valid", errors.isEmpty());
                result.put("rowCount", rows.size() - 1);
                result.put("columnCount", headers.length);
            }
        } catch (Exception e) {
            errors.add("Error parsing CSV: " + e.getMessage());
            result.put("valid", false);
        }
        
        result.put("errors", errors);
        result.put("warnings", warnings);
        return result;
    }
    
    // Upload and Backup CSV
    public Map<String, Object> uploadCSV(String csvType, MultipartFile file) throws IOException {
        Map<String, Object> result = new HashMap<>();
        String fileName = getFileName(csvType);
        Path path = Paths.get(CSV_DIR, fileName);
        
        // Create backup
        if (Files.exists(path)) {
            String backupName = fileName.replace(".csv", "_backup_" + System.currentTimeMillis() + ".csv");
            Path backupPath = Paths.get(CSV_DIR, backupName);
            Files.copy(path, backupPath, StandardCopyOption.REPLACE_EXISTING);
            result.put("backupCreated", backupName);
        }
        
        // Save new file
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
        result.put("uploaded", true);
        result.put("fileName", fileName);
        result.put("fileSize", Files.size(path));
        
        return result;
    }
    
    // Get CSV Statistics
    public Map<String, Object> getCSVStatistics(String csvType) {
        Map<String, Object> stats = new HashMap<>();
        String fileName = getFileName(csvType);
        Path path = Paths.get(CSV_DIR, fileName);
        
        try (CSVReader reader = new CSVReader(new FileReader(path.toFile()))) {
            List<String[]> rows;
            try {
                rows = reader.readAll();
            } catch (com.opencsv.exceptions.CsvException e) {
                logger.severe("Error reading CSV: " + e.getMessage());
                stats.put("error", "Failed to read CSV: " + e.getMessage());
                return stats;
            }
            if (rows.size() > 1) {
                String[] headers = rows.get(0);
                stats.put("totalRows", rows.size() - 1);
                stats.put("totalColumns", headers.length);
                
                // Column-specific statistics
                Map<String, Object> columnStats = new HashMap<>();
                for (int col = 0; col < headers.length; col++) {
                    Set<String> uniqueValues = new HashSet<>();
                    int nullCount = 0;
                    
                    for (int row = 1; row < rows.size(); row++) {
                        String value = rows.get(row)[col];
                        if (value == null || value.trim().isEmpty()) {
                            nullCount++;
                        } else {
                            uniqueValues.add(value);
                        }
                    }
                    
                    Map<String, Object> colStats = new HashMap<>();
                    colStats.put("uniqueValues", uniqueValues.size());
                    colStats.put("nullCount", nullCount);
                    colStats.put("fillRate", ((rows.size() - 1 - nullCount) * 100.0) / (rows.size() - 1));
                    columnStats.put(headers[col], colStats);
                }
                
                stats.put("columnStatistics", columnStats);
            }
        } catch (Exception e) {
            logger.severe("Error generating statistics: " + e.getMessage());
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }
    
    // Get CSV Preview
    public Map<String, Object> getCSVPreview(String csvType, int rows) {
        Map<String, Object> preview = new HashMap<>();
        String fileName = getFileName(csvType);
        Path path = Paths.get(CSV_DIR, fileName);
        
        try (CSVReader reader = new CSVReader(new FileReader(path.toFile()))) {
            List<String[]> allRows = reader.readAll();
            if (!allRows.isEmpty()) {
                preview.put("headers", Arrays.asList(allRows.get(0)));
                List<List<String>> dataRows = allRows.stream()
                    .skip(1)
                    .limit(rows)
                    .map(Arrays::asList)
                    .collect(Collectors.toList());
                preview.put("data", dataRows);
                preview.put("totalRows", allRows.size() - 1);
            }
        } catch (Exception e) {
            logger.severe("Error getting preview: " + e.getMessage());
            preview.put("error", e.getMessage());
        }
        
        return preview;
    }
    
    // Export CSV with filters
    public byte[] exportFilteredCSV(String csvType, Map<String, String> filters) throws IOException {
        String fileName = getFileName(csvType);
        Path path = Paths.get(CSV_DIR, fileName);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        CSVWriter writer = new CSVWriter(new OutputStreamWriter(outputStream));
        
        try (CSVReader reader = new CSVReader(new FileReader(path.toFile()))) {
            List<String[]> rows;
            try {
                rows = reader.readAll();
            } catch (com.opencsv.exceptions.CsvException e) {
                throw new IOException("Failed to read CSV: " + e.getMessage(), e);
            }
            if (!rows.isEmpty()) {
                String[] headers = rows.get(0);
                writer.writeNext(headers);
                
                // Apply filters
                for (int i = 1; i < rows.size(); i++) {
                    String[] row = rows.get(i);
                    boolean matches = true;
                    
                    for (Map.Entry<String, String> filter : filters.entrySet()) {
                        int colIndex = Arrays.asList(headers).indexOf(filter.getKey());
                        if (colIndex >= 0 && colIndex < row.length) {
                            if (!row[colIndex].toLowerCase().contains(filter.getValue().toLowerCase())) {
                                matches = false;
                                break;
                            }
                        }
                    }
                    
                    if (matches) {
                        writer.writeNext(row);
                    }
                }
            }
        }
        
        writer.close();
        return outputStream.toByteArray();
    }
    
    // Helper Methods
    private String getFileName(String csvType) {
        return switch (csvType.toLowerCase()) {
            case "batches" -> "batches.csv";
            case "faculty" -> "faculty.csv";
            case "rooms" -> "rooms.csv";
            case "courses" -> "courses.csv";
            case "minor" -> "minor.csv";
            default -> csvType + ".csv";
        };
    }
    
    private Set<String> getExpectedHeaders(String csvType) {
        return switch (csvType.toLowerCase()) {
            case "batches" -> Set.of("id", "batchName", "year", "strength");
            case "faculty" -> Set.of("id", "name", "email", "password", "subjects", "maxHoursPerDay");
            case "rooms" -> Set.of("id", "roomNumber", "capacity", "type");
            case "courses" -> Set.of("id", "courseCode", "name", "courseType", "batchId", "lecture", "theory", "practical", "credits", "hoursPerWeek", "eligibleFacultyIds");
            default -> new HashSet<>();
        };
    }
    
    private int countRows(Path path) throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            return (int) reader.lines()
                .filter(line -> !line.trim().startsWith("#") && !line.trim().isEmpty())
                .count() - 1; // Subtract header
        }
    }
    
    private List<String> getColumnNames(Path path) throws IOException {
        try (CSVReader reader = new CSVReader(Files.newBufferedReader(path))) {
            String[] headers;
            try {
                headers = reader.readNext();
            } catch (com.opencsv.exceptions.CsvValidationException e) {
                throw new IOException("Invalid CSV format: " + e.getMessage(), e);
            }
            return headers != null ? Arrays.asList(headers) : new ArrayList<>();
        }
    }
}
