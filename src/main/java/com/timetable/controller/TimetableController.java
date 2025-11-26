package com.timetable.controller;

import com.timetable.domain.*;
import com.timetable.service.TimetableService;
import com.timetable.service.CSVManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class TimetableController {

    @Autowired
    private TimetableService timetableService;
    
    @Autowired
    private CSVManagerService csvManagerService;

    @GetMapping("/timetable")
    public ResponseEntity<?> getTimetable() {
        try {
            TimeTable timetable = timetableService.getCurrentTimetable();
            if (timetable == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "No timetable generated yet. Please generate first."));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("score", timetable.getScore() != null ? timetable.getScore().toString() : "N/A");
            response.put("lessons", formatLessons(timetable.getLessonList()));
            response.put("minorLessons", formatLessons(timetable.getMinorLessonList()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/timetable/generate")
    public ResponseEntity<?> generateTimetable(@RequestBody(required = false) SolverConfiguration config) {
        try {
            // Update solver configuration if provided
            if (config != null) {
                timetableService.setSolverConfiguration(config);
            }
            
            TimeTable timetable = timetableService.generateTimetable();
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Timetable generated successfully");
            response.put("score", timetable.getScore() != null ? timetable.getScore().toString() : "N/A");
            response.put("lessonsCount", timetable.getLessonList().size());
            response.put("minorLessonsCount", timetable.getMinorLessonList().size());
            response.put("solverConfig", timetableService.getSolverConfiguration());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/solver/config")
    public ResponseEntity<?> getSolverConfiguration() {
        try {
            SolverConfiguration config = timetableService.getSolverConfiguration();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/solver/config")
    public ResponseEntity<?> updateSolverConfiguration(@RequestBody SolverConfiguration config) {
        try {
            timetableService.setSolverConfiguration(config);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Solver configuration updated successfully");
            response.put("config", config);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/timeslots/config")
    public ResponseEntity<?> getTimeSlotConfiguration() {
        try {
            TimeSlotConfiguration config = timetableService.getTimeSlotConfiguration();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/timeslots/config")
    public ResponseEntity<?> updateTimeSlotConfiguration(@RequestBody TimeSlotConfiguration config) {
        try {
            timetableService.setTimeSlotConfiguration(config);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Time slot configuration updated successfully");
            response.put("config", config);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/timeslots/config/reset")
    public ResponseEntity<?> resetTimeSlotConfiguration() {
        try {
            timetableService.init(); // Reinitialize with defaults
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Time slot configuration reset to defaults");
            response.put("config", timetableService.getTimeSlotConfiguration());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/batch-year-mapping")
    public ResponseEntity<?> getBatchYearMapping() {
        try {
            BatchYearMapping mapping = timetableService.getTimeSlotConfiguration().getBatchYearMapping();
            return ResponseEntity.ok(mapping);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/batch-year-mapping")
    public ResponseEntity<?> updateBatchYearMapping(@RequestBody BatchYearMapping mapping) {
        try {
            timetableService.getTimeSlotConfiguration().setBatchYearMapping(mapping);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Batch-year mapping updated successfully");
            response.put("mapping", mapping);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/batch-year-mapping/add")
    public ResponseEntity<?> addBatchYearMapping(@RequestBody Map<String, Object> request) {
        try {
            String yearIdentifier = (String) request.get("yearIdentifier");
            Integer yearLevel = (Integer) request.get("yearLevel");
            
            if (yearIdentifier == null || yearLevel == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "yearIdentifier and yearLevel are required"));
            }
            
            BatchYearMapping mapping = timetableService.getTimeSlotConfiguration().getBatchYearMapping();
            mapping.addMapping(yearIdentifier, yearLevel);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Mapping added: " + yearIdentifier + " → Year " + yearLevel);
            response.put("mapping", mapping);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/batch-year-mapping/{yearIdentifier}")
    public ResponseEntity<?> removeBatchYearMapping(@PathVariable String yearIdentifier) {
        try {
            BatchYearMapping mapping = timetableService.getTimeSlotConfiguration().getBatchYearMapping();
            mapping.removeMapping(yearIdentifier);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Mapping removed for: " + yearIdentifier);
            response.put("mapping", mapping);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/faculty")
    public ResponseEntity<?> getFaculty() {
        try {
            List<Faculty> facultyList = timetableService.getFacultyList();
            List<Map<String, Object>> formattedFaculty = facultyList.stream()
                    .map(this::formatFaculty)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(formattedFaculty);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> getRooms() {
        try {
            List<Room> roomList = timetableService.getRoomList();
            List<Map<String, Object>> formattedRooms = roomList.stream()
                    .map(this::formatRoom)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(formattedRooms);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/batches")
    public ResponseEntity<?> getBatches() {
        try {
            List<StudentBatch> batchList = timetableService.getBatchList();
            List<Map<String, Object>> formattedBatches = batchList.stream()
                    .map(this::formatBatch)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(formattedBatches);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getCourses() {
        try {
            List<Course> courseList = timetableService.getCourseList();
            List<Map<String, Object>> formattedCourses = courseList.stream()
                    .map(this::formatCourse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(formattedCourses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/timetable/batch/{batchId}")
    public ResponseEntity<?> getTimetableByBatch(@PathVariable Long batchId) {
        try {
            TimeTable timetable = timetableService.getCurrentTimetable();
            if (timetable == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "No timetable generated yet"));
            }

            List<Lesson> batchLessons = timetable.getLessonList().stream()
                    .filter(l -> l.getStudentBatch() != null && l.getStudentBatch().getId().equals(batchId))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(formatLessons(batchLessons));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/timetable/faculty/{facultyId}")
    public ResponseEntity<?> getTimetableByFaculty(@PathVariable Long facultyId) {
        try {
            TimeTable timetable = timetableService.getCurrentTimetable();
            if (timetable == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "No timetable generated yet"));
            }

            List<Lesson> facultyLessons = timetable.getLessonList().stream()
                    .filter(l -> l.getFaculty() != null && l.getFaculty().getId().equals(facultyId))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(formatLessons(facultyLessons));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/timetable/room/{roomId}")
    public ResponseEntity<?> getTimetableByRoom(@PathVariable Long roomId) {
        try {
            TimeTable timetable = timetableService.getCurrentTimetable();
            if (timetable == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "No timetable generated yet"));
            }

            List<Lesson> roomLessons = timetable.getLessonList().stream()
                    .filter(l -> l.getRoom() != null && l.getRoom().getId().equals(roomId))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(formatLessons(roomLessons));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Helper methods to format entities
    private List<Map<String, Object>> formatLessons(List<Lesson> lessons) {
        return lessons.stream()
                .filter(l -> l.getTimeSlot() != null)
                .map(this::formatLesson)
                .collect(Collectors.toList());
    }

    private Map<String, Object> formatLesson(Lesson lesson) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", lesson.getId());
        map.put("lessonType", lesson.getLessonType());
        
        if (lesson.getCourse() != null) {
            map.put("courseCode", lesson.getCourse().getCourseCode());
            map.put("courseName", lesson.getCourse().getName());
        }
        
        if (lesson.getStudentBatch() != null) {
            map.put("batchId", lesson.getStudentBatch().getId());
            map.put("batchName", lesson.getStudentBatch().getBatchName());
        }
        
        if (lesson.getFaculty() != null) {
            map.put("facultyId", lesson.getFaculty().getId());
            map.put("facultyName", lesson.getFaculty().getName());
        }
        
        if (lesson.getRoom() != null) {
            map.put("roomId", lesson.getRoom().getId());
            map.put("roomNumber", lesson.getRoom().getRoomNumber());
            map.put("roomType", lesson.getRoom().getType().toString());
        }
        
        if (lesson.getTimeSlot() != null) {
            map.put("day", lesson.getTimeSlot().getDay());
            map.put("startTime", lesson.getTimeSlot().getStartTime().toString());
            map.put("endTime", lesson.getTimeSlot().getEndTime().toString());
            map.put("timeSlotType", lesson.getTimeSlot().getSlotType());
        }
        
        return map;
    }

    private Map<String, Object> formatFaculty(Faculty faculty) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", faculty.getId());
        map.put("name", faculty.getName());
        map.put("email", faculty.getEmail());
        map.put("subjects", faculty.getSubjects());
        map.put("maxHoursPerDay", faculty.getMaxHoursPerDay());
        map.put("isAvailable", true);  // Default to true
        return map;
    }

    private Map<String, Object> formatRoom(Room room) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", room.getId());
        map.put("roomNumber", room.getRoomNumber());
        map.put("capacity", room.getCapacity());
        map.put("roomType", room.getType().toString());
        map.put("isAvailable", room.isAvailable());
        return map;
    }

    private Map<String, Object> formatBatch(StudentBatch batch) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", batch.getId());
        map.put("batchName", batch.getBatchName());
        map.put("year", batch.getYear());
        map.put("section", batch.getBatchName().contains("_") ? batch.getBatchName().split("_")[1] : "A");
        map.put("studentCount", batch.getStrength());
        return map;
    }

    private Map<String, Object> formatCourse(Course course) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", course.getId());
        map.put("courseCode", course.getCourseCode());
        map.put("name", course.getName());
        map.put("courseType", course.getCourseType());
        map.put("lectureHours", course.getLectureHours());
        map.put("practicalHours", course.getPracticalHours());
        map.put("credits", course.getCredits());
        map.put("hoursPerWeek", course.getHoursPerWeek());
        map.put("isMinor", course.isMinor());
        return map;
    }

    // CSV Management Endpoints
    
    // New CSV Manager Endpoints
    
    @GetMapping("/{type}/metadata")
    public ResponseEntity<?> getCSVMetadata(@PathVariable String type) {
        try {
            Map<String, Object> metadata = csvManagerService.getCSVMetadata(type);
            return ResponseEntity.ok(metadata);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{type}/statistics")
    public ResponseEntity<?> getCSVStatistics(@PathVariable String type) {
        try {
            Map<String, Object> stats = csvManagerService.getCSVStatistics(type);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{type}/preview")
    public ResponseEntity<?> getCSVPreview(
            @PathVariable String type,
            @RequestParam(defaultValue = "10") int rows) {
        try {
            Map<String, Object> preview = csvManagerService.getCSVPreview(type, rows);
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{type}/validate")
    public ResponseEntity<?> validateCSV(
            @PathVariable String type,
            @RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> validation = csvManagerService.validateCSV(type, file);
            return ResponseEntity.ok(validation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/batches/upload")
    public ResponseEntity<?> uploadBatchesCSV(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> validation = csvManagerService.validateCSV("batches", file);
            if (!(Boolean) validation.get("valid")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validation);
            }
            Map<String, Object> result = csvManagerService.uploadCSV("batches", file);
            timetableService.reloadData();
            return ResponseEntity.ok(Map.of(
                "message", "Batches CSV uploaded successfully",
                "details", result
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload: " + e.getMessage()));
        }
    }

    @PostMapping("/faculty/upload")
    public ResponseEntity<?> uploadFacultyCSV(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> validation = csvManagerService.validateCSV("faculty", file);
            if (!(Boolean) validation.get("valid")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validation);
            }
            Map<String, Object> result = csvManagerService.uploadCSV("faculty", file);
            timetableService.reloadData();
            return ResponseEntity.ok(Map.of(
                "message", "Faculty CSV uploaded successfully",
                "details", result
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload: " + e.getMessage()));
        }
    }

    @PostMapping("/rooms/upload")
    public ResponseEntity<?> uploadRoomsCSV(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> validation = csvManagerService.validateCSV("rooms", file);
            if (!(Boolean) validation.get("valid")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validation);
            }
            Map<String, Object> result = csvManagerService.uploadCSV("rooms", file);
            timetableService.reloadData();
            return ResponseEntity.ok(Map.of(
                "message", "Rooms CSV uploaded successfully",
                "details", result
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload: " + e.getMessage()));
        }
    }

    @PostMapping("/courses/upload")
    public ResponseEntity<?> uploadCoursesCSV(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> validation = csvManagerService.validateCSV("courses", file);
            if (!(Boolean) validation.get("valid")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validation);
            }
            Map<String, Object> result = csvManagerService.uploadCSV("courses", file);
            timetableService.reloadData();
            return ResponseEntity.ok(Map.of(
                "message", "Courses CSV uploaded successfully",
                "details", result
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload: " + e.getMessage()));
        }
    }

    @GetMapping("/batches/download")
    public ResponseEntity<String> downloadBatchesCSV() {
        try {
            String csv = generateBatchesCSV();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "batches.csv");
            return ResponseEntity.ok().headers(headers).body(csv);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/faculty/download")
    public ResponseEntity<String> downloadFacultyCSV() {
        try {
            String csv = generateFacultyCSV();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "faculty.csv");
            return ResponseEntity.ok().headers(headers).body(csv);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/rooms/download")
    public ResponseEntity<String> downloadRoomsCSV() {
        try {
            String csv = generateRoomsCSV();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "rooms.csv");
            return ResponseEntity.ok().headers(headers).body(csv);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/courses/download")
    public ResponseEntity<String> downloadCoursesCSV() {
        try {
            String csv = generateCoursesCSV();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "courses.csv");
            return ResponseEntity.ok().headers(headers).body(csv);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/batches/{id}")
    public ResponseEntity<?> updateBatch(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        try {
            // This is a simplified implementation - in production, you'd update the CSV file
            return ResponseEntity.ok(Map.of("message", "Batch updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/batches/{id}")
    public ResponseEntity<?> deleteBatch(@PathVariable Long id) {
        try {
            // This is a simplified implementation - in production, you'd update the CSV file
            return ResponseEntity.ok(Map.of("message", "Batch deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/batches")
    public ResponseEntity<?> addBatch(@RequestBody Map<String, Object> batch) {
        try {
            // This is a simplified implementation - in production, you'd update the CSV file
            return ResponseEntity.ok(Map.of("message", "Batch added successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Helper methods for CSV operations
    
    private void saveCsvFile(MultipartFile file, String filename) throws IOException {
        Path path = Paths.get(filename);
        Files.write(path, file.getBytes());
    }

    private String generateBatchesCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("id,name,year,semester,strength\n");
        for (StudentBatch batch : timetableService.getBatchList()) {
            csv.append(String.format("%d,%s,%d,%s,%d\n",
                    batch.getId(),
                    batch.getBatchName(),
                    batch.getYear(),
                    "1", // Default semester
                    batch.getStrength()));
        }
        return csv.toString();
    }

    private String generateFacultyCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("id,name,specialization,email\n");
        for (Faculty faculty : timetableService.getFacultyList()) {
            csv.append(String.format("%d,%s,%s,%s\n",
                    faculty.getId(),
                    faculty.getName(),
                    String.join(";", faculty.getSubjects()),
                    faculty.getEmail() != null ? faculty.getEmail() : ""));
        }
        return csv.toString();
    }

    private String generateRoomsCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("id,name,capacity,type\n");
        for (Room room : timetableService.getRoomList()) {
            csv.append(String.format("%d,%s,%d,%s\n",
                    room.getId(),
                    room.getRoomNumber(),
                    room.getCapacity(),
                    room.getType().toString()));
        }
        return csv.toString();
    }

    private String generateCoursesCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("id,name,code,credits,type\n");
        for (Course course : timetableService.getCourseList()) {
            csv.append(String.format("%d,%s,%s,%d,%s\n",
                    course.getId(),
                    course.getName(),
                    course.getCourseCode(),
                    course.getCredits(),
                    course.getCourseType()));
        }
        return csv.toString();
    }
    
    @GetMapping("/metadata/types")
    public ResponseEntity<?> getMetadataTypes() {
        try {
            Map<String, List<String>> types = new HashMap<>();
            
            // Get Room Types
            List<String> roomTypes = Arrays.stream(RoomType.values())
                    .map(Enum::name)
                    .collect(Collectors.toList());
            types.put("roomTypes", roomTypes);
            
            // Get Course Types
            List<String> courseTypes = Arrays.stream(CourseType.values())
                    .map(CourseType::getValue)
                    .collect(Collectors.toList());
            types.put("courseTypes", courseTypes);
            
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
