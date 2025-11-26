package com.timetable.service;

import com.timetable.domain.*;
import com.timetable.score.TimeTableConstraintProvider;
import com.timetable.util.CSVDataLoader;
import com.timetable.util.ConstraintConfigurationHolder;
import org.optaplanner.core.api.solver.Solver;
import org.optaplanner.core.api.solver.SolverFactory;
import org.optaplanner.core.config.solver.SolverConfig;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.FileWriter;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalTime;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class TimetableService {
    private static final Logger logger = Logger.getLogger(TimetableService.class.getName());
    private TimeTable currentTimetable;
    private List<Faculty> facultyList;
    private List<Room> roomList;
    private List<Course> courseList;
    private List<StudentBatch> batchList;
    private SolverConfiguration solverConfiguration = new SolverConfiguration();
    private TimeSlotConfiguration timeSlotConfiguration;
    
    @PostConstruct
    public void init() {
        logger.info("Initializing TimetableService and loading CSV data...");
        try {
            initializeDefaultTimeSlotConfiguration();
            // Set configuration in the holder so ConstraintProvider can access it
            ConstraintConfigurationHolder.getInstance().setTimeSlotConfiguration(timeSlotConfiguration);
            reloadData();
            logger.info("CSV data loaded successfully on startup");
        } catch (Exception e) {
            logger.log(Level.WARNING, "Could not load CSV data on startup", e);
        }
    }
    
    // Initialize default time slot configuration
    private void initializeDefaultTimeSlotConfiguration() {
        timeSlotConfiguration = new TimeSlotConfiguration();
        
        // Initialize default batch-year mappings (current academic year)
        // These should be updated each academic year as batches graduate
        timeSlotConfiguration.getBatchYearMapping().addMapping("2024", 1); // First year
        timeSlotConfiguration.getBatchYearMapping().addMapping("2023", 2); // Second year
        timeSlotConfiguration.getBatchYearMapping().addMapping("2022", 3); // Third year
        timeSlotConfiguration.getBatchYearMapping().addMapping("2021", 4); // Fourth year
        
        // Year 1 defaults
        timeSlotConfiguration.getYear1Slots().add(new TimeSlotDefinition("09:00", "10:30", "LECTURE"));
        timeSlotConfiguration.getYear1Slots().add(new TimeSlotDefinition("10:45", "12:15", "LECTURE"));
        timeSlotConfiguration.getYear1Slots().add(new TimeSlotDefinition("12:15", "13:15", "LECTURE"));
        timeSlotConfiguration.getYear1Slots().add(new TimeSlotDefinition("14:30", "16:00", "LECTURE"));
        timeSlotConfiguration.getYear1Slots().add(new TimeSlotDefinition("16:15", "17:45", "LECTURE"));
        timeSlotConfiguration.getYear1Slots().add(new TimeSlotDefinition("11:15", "13:15", "LAB"));
        timeSlotConfiguration.getYear1Slots().add(new TimeSlotDefinition("14:30", "16:30", "LAB"));
        
        // Year 2 defaults
        timeSlotConfiguration.getYear2Slots().add(new TimeSlotDefinition("09:00", "10:30", "LECTURE"));
        timeSlotConfiguration.getYear2Slots().add(new TimeSlotDefinition("10:45", "12:15", "LECTURE"));
        timeSlotConfiguration.getYear2Slots().add(new TimeSlotDefinition("12:15", "13:15", "LECTURE"));
        timeSlotConfiguration.getYear2Slots().add(new TimeSlotDefinition("14:30", "16:00", "LECTURE"));
        timeSlotConfiguration.getYear2Slots().add(new TimeSlotDefinition("14:30", "16:30", "LAB"));
        
        // Year 3 defaults
        timeSlotConfiguration.getYear3Slots().add(new TimeSlotDefinition("09:00", "10:30", "LECTURE"));
        timeSlotConfiguration.getYear3Slots().add(new TimeSlotDefinition("11:15", "12:15", "LECTURE"));
        timeSlotConfiguration.getYear3Slots().add(new TimeSlotDefinition("13:30", "15:00", "LECTURE"));
        timeSlotConfiguration.getYear3Slots().add(new TimeSlotDefinition("15:15", "16:45", "LECTURE"));
        timeSlotConfiguration.getYear3Slots().add(new TimeSlotDefinition("17:00", "18:00", "LECTURE"));
        timeSlotConfiguration.getYear3Slots().add(new TimeSlotDefinition("09:00", "11:00", "LAB"));
        
        // Year 4 defaults
        timeSlotConfiguration.getYear4Slots().add(new TimeSlotDefinition("09:00", "10:30", "LECTURE"));
        timeSlotConfiguration.getYear4Slots().add(new TimeSlotDefinition("13:30", "14:30", "LECTURE"));
        timeSlotConfiguration.getYear4Slots().add(new TimeSlotDefinition("14:45", "16:15", "LECTURE"));
        timeSlotConfiguration.getYear4Slots().add(new TimeSlotDefinition("16:30", "18:00", "LECTURE"));
        
        // Minor slots defaults
        timeSlotConfiguration.getMinorSlots().add(new TimeSlotDefinition("08:00", "09:00", "MINOR"));
        timeSlotConfiguration.getMinorSlots().add(new TimeSlotDefinition("18:00", "19:30", "MINOR"));
        
        logger.info("Default time slot configuration initialized with batch-year mappings: " + 
                    timeSlotConfiguration.getBatchYearMapping().toString());
    }

    public TimeTable generateTimetable() {
        try {
            // Load data from CSV files
            facultyList = CSVDataLoader.loadFaculty("faculty.csv");
            roomList = CSVDataLoader.loadRooms("rooms.csv");
            courseList = CSVDataLoader.loadCourses("courses.csv", facultyList);
            List<Course> minorCourseList = CSVDataLoader.loadMinors("minor.csv", facultyList);
            batchList = CSVDataLoader.loadStudentBatches("batches.csv", courseList);

            if (facultyList.isEmpty() || roomList.isEmpty() || courseList.isEmpty() || minorCourseList.isEmpty() || batchList.isEmpty()) {
                throw new RuntimeException("Essential data missing");
            }

            List<TimeSlot> timeSlotList = new ArrayList<>();
            for (StudentBatch batch : batchList) {
                timeSlotList.addAll(createTimeSlots(batch));
            }
            List<TimeSlot> minorTimeSlotList = createMinorTimeSlots();

            // Create initial solution
            TimeTable problem = createInitialSolution(facultyList, roomList, timeSlotList, minorTimeSlotList, batchList, courseList, minorCourseList);

            // Configure solver with user-configurable parameters
            SolverConfig solverConfig = new SolverConfig()
                    .withSolutionClass(TimeTable.class)
                    .withEntityClasses(Lesson.class)
                    .withConstraintProviderClass(TimeTableConstraintProvider.class)
                    .withTerminationSpentLimit(Duration.ofSeconds(solverConfiguration.getTotalTerminationSeconds()));
            
            // Add optional termination conditions if configured
            if (solverConfiguration.getBestScoreLimit() != null) {
                // Note: Best score termination requires OptaPlanner Pro
                logger.info("Best score limit set to: " + solverConfiguration.getBestScoreLimit());
            }
            
            if (solverConfiguration.getUnimprovedSecondsLimit() != null) {
                solverConfig.getTerminationConfig().setUnimprovedSecondsSpentLimit(
                    Long.valueOf(solverConfiguration.getUnimprovedSecondsLimit())
                );
            }
            
            logger.info("Solver configuration: " + solverConfiguration.toString());

            // Solve timetable
            SolverFactory<TimeTable> solverFactory = SolverFactory.create(solverConfig);
            Solver<TimeTable> solver = solverFactory.buildSolver();

            logger.info("Starting solver...");
            TimeTable solution = solver.solve(problem);
            logger.info("Solver finished. Score: " + solution.getScore());

            currentTimetable = solution;
            return solution;

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error generating timetable", e);
            throw new RuntimeException("Failed to generate timetable", e);
        }
    }

    public TimeTable getCurrentTimetable() {
        return currentTimetable;
    }

    public List<Faculty> getFacultyList() {
        return facultyList != null ? facultyList : new ArrayList<>();
    }

    public List<Room> getRoomList() {
        return roomList != null ? roomList : new ArrayList<>();
    }

    public List<StudentBatch> getBatchList() {
        return batchList != null ? batchList : new ArrayList<>();
    }

    public List<Course> getCourseList() {
        return courseList != null ? courseList : new ArrayList<>();
    }

    public void reloadData() {
        try {
            facultyList = CSVDataLoader.loadFaculty("faculty.csv");
            roomList = CSVDataLoader.loadRooms("rooms.csv");
            courseList = CSVDataLoader.loadCourses("courses.csv", facultyList);
            batchList = CSVDataLoader.loadStudentBatches("batches.csv", courseList);
            logger.info("Data reloaded successfully");
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error reloading data", e);
            throw new RuntimeException("Failed to reload data", e);
        }
    }
    
    public SolverConfiguration getSolverConfiguration() {
        return solverConfiguration;
    }
    
    public void setSolverConfiguration(SolverConfiguration solverConfiguration) {
        if (solverConfiguration == null) {
            throw new IllegalArgumentException("Solver configuration cannot be null");
        }
        this.solverConfiguration = solverConfiguration;
        logger.info("Solver configuration updated: " + solverConfiguration.toString());
    }
    
    public TimeSlotConfiguration getTimeSlotConfiguration() {
        return timeSlotConfiguration;
    }
    
    public void setTimeSlotConfiguration(TimeSlotConfiguration timeSlotConfiguration) {
        if (timeSlotConfiguration == null) {
            throw new IllegalArgumentException("Time slot configuration cannot be null");
        }
        this.timeSlotConfiguration = timeSlotConfiguration;
        // Update the holder so ConstraintProvider has access to the latest configuration
        ConstraintConfigurationHolder.getInstance().setTimeSlotConfiguration(timeSlotConfiguration);
        logger.info("Time slot configuration updated: " + timeSlotConfiguration.toString());
    }

    // Helper methods
    private List<TimeSlot> createTimeSlots(StudentBatch batch) {
        List<TimeSlot> timeSlots = new ArrayList<>();
        String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"};
        Long id = (long) (batch.getId() * 1000);

        List<TimeSlotDefinition> timeSlotDefs = timeSlotConfiguration.getSlotsByYear(batch.getBatchName());

        for (String day : days) {
            for (TimeSlotDefinition slotDef : timeSlotDefs) {
                LocalTime startTime = slotDef.getStartTimeAsLocalTime();
                LocalTime endTime = slotDef.getEndTimeAsLocalTime();
                String slotType = slotDef.getSlotType();
                timeSlots.add(new TimeSlot(id++, day, startTime, endTime, slotType));
            }
        }
        return timeSlots;
    }

    private List<TimeSlot> createMinorTimeSlots() {
        List<TimeSlot> timeSlots = new ArrayList<>();
        String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"};
        Long id = 10000L;

        for (String day : days) {
            for (TimeSlotDefinition slotDef : timeSlotConfiguration.getMinorSlots()) {
                LocalTime startTime = slotDef.getStartTimeAsLocalTime();
                LocalTime endTime = slotDef.getEndTimeAsLocalTime();
                String slotType = slotDef.getSlotType();
                timeSlots.add(new TimeSlot(id++, day, startTime, endTime, slotType));
            }
        }
        return timeSlots;
    }

    private TimeTable createInitialSolution(List<Faculty> facultyList, List<Room> roomList,
                                            List<TimeSlot> timeSlotList, List<TimeSlot> minorTimeSlotList,
                                            List<StudentBatch> batchList, List<Course> courseList,
                                            List<Course> minorCourseList) {
        List<Lesson> lessonList = new ArrayList<>();
        List<Lesson> minorLessonList = new ArrayList<>();
        Long lessonId = 1L;

        // Create lessons for regular courses
        for (Course course : courseList) {
            for (Integer batchId : course.getBatchIds()) {
                StudentBatch batch = batchList.stream()
                        .filter(b -> b.getId().equals(Long.valueOf(batchId)))
                        .findFirst().orElse(null);

                if (batch != null) {
                    int totalLessons = course.getHoursPerWeek();
                    for (int i = 0; i < totalLessons; i++) {
                        Lesson lesson = new Lesson(lessonId++, course, batch, roomList);
                        lesson.setLessonType(course.getPracticalHours() > 0 && i >= course.getLectureHours() ? "LAB" : "LECTURE");
                        
                        // Assign faculty if eligible
                        if (!course.getEligibleFaculty().isEmpty()) {
                            lesson.setFaculty(course.getEligibleFaculty().get(0));
                        }
                        
                        lessonList.add(lesson);
                    }
                }
            }
        }

        // Create lessons for minor courses
        for (Course minorCourse : minorCourseList) {
            int totalLessons = minorCourse.getHoursPerWeek();
            for (int i = 0; i < totalLessons; i++) {
                Lesson lesson = new Lesson(lessonId++, minorCourse, roomList);
                lesson.setLessonType("MINOR");
                
                if (!minorCourse.getEligibleFaculty().isEmpty()) {
                    lesson.setFaculty(minorCourse.getEligibleFaculty().get(0));
                }
                
                minorLessonList.add(lesson);
            }
        }

        return new TimeTable(1L, lessonList, minorLessonList, facultyList, roomList, timeSlotList, minorTimeSlotList);
    }
}
