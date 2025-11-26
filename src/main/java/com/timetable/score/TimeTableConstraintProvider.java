
package com.timetable.score;

import com.timetable.domain.*;
import com.timetable.util.ConstraintConfigurationHolder;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.*;

import java.time.Duration;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

public class TimeTableConstraintProvider implements ConstraintProvider {
    // Constants
    private static final int MIN_CLASSES_PER_BATCH = 20;
    private static final int MAX_CLASSES_PER_BATCH = 25;
    private static final int TARGET_FACULTY_LESSONS = 15;
    private static final int DEFAULT_TARGET_DAILY_LESSONS = 4;
    private static final int DEFAULT_ALLOWED_VARIANCE = 1;
    private static final int DEFAULT_MAX_GAP_MINUTES = 60;
    private static final int DEFAULT_MAX_TEACHER_GAP_MINUTES = 90;
    
    // Penalty weights for optimal constraint prioritization - INCREASED for zero conflicts
    private static final int CRITICAL_CONFLICT_PENALTY = 10000;  // Absolute conflicts - must never happen
    private static final int HIGH_PRIORITY_PENALTY = 1000;       // Important constraints
    private static final int MEDIUM_PRIORITY_PENALTY = 100;      // Structural constraints
    private static final int LOW_PRIORITY_PENALTY = 10;          // Assignment constraints
    private static final int SOFT_HIGH_PRIORITY = 50;            // Important soft constraints
    private static final int SOFT_MEDIUM_PRIORITY = 20;          // Medium soft constraints
    private static final int SOFT_LOW_PRIORITY = 5;              // Low soft constraints

    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[] {
                // ============================================================================
                // CRITICAL HARD CONSTRAINTS - Must NEVER be violated (Weight: 10000)
                // These are absolute requirements for a valid timetable
                // ============================================================================
                ensureLessonAssignments(factory),           // All lessons must have timeslot and room
                roomConflict(factory),                      // No room double-booking
                teacherConflict(factory),                   // No teacher double-booking
                studentGroupConflict(factory),              // No student batch conflicts
                studentBatchConflict(factory),              // Enhanced batch time conflicts
                facultyTimeConflictConstraint(factory),     // Faculty time conflicts with overlap detection
                facultyMultiBatchConstraint(factory),       // Faculty teaching multiple batches simultaneously
                
                // ============================================================================
                // HIGH PRIORITY HARD CONSTRAINTS (Weight: 1000)
                // Essential structural requirements
                // ============================================================================
                roomCapacity(factory),                      // Room must fit all students
                teacherQualification(factory),              // Teacher must be qualified for course
                lectureDurationConstraint(factory),         // Lecture duration matching
                labDurationConstraint(factory),             // Lab duration matching
                noClassesDuringLunchHour(factory),          // Respect lunch hours
                
                // ============================================================================
                // LAB-SPECIFIC HARD CONSTRAINTS (Weight: 1000)
                // Labs have strict requirements
                // ============================================================================
                weeklyLabScheduling(factory),               // Weekly lab requirements
                labRoomAssignment(factory),                 // Labs must be in lab rooms
                onlyOneLabPerBatchPerDay(factory),          // Max one lab per batch per day
                labRoomConstraint(factory),                 // Lab room type validation
                onlyLabCoursesInLabRooms(factory),          // Lab rooms for labs only
                
                // ============================================================================
                // ROOM AND TIMESLOT HARD CONSTRAINTS (Weight: 100)
                // Room assignments and time slot compatibility
                // ============================================================================
                predefinedRoomAssignment(factory),          // Predefined room rules
                lectureRoomConstraint(factory),             // Lecture room type validation
                lectureInRegularRooms(factory),             // Lectures in regular rooms
                singleCoursePerDayForBatch(factory),        // One course per day per batch
                labTimeSlotConstraint(factory),             // Lab time slot requirements
                batchTimeSlotCompatibility(factory),        // Batch-timeslot compatibility
                
                // ============================================================================
                // MINOR COURSE HARD CONSTRAINTS (Weight: 1000)
                // Minor courses have fixed requirements
                // ============================================================================
                minorValidRoom(factory),                    // Minor course room validation
                minorFixedTimeslot(factory),                // Minor fixed time slots
                noRoomConflictForMinors(factory),           // Minor room conflicts
                minorTimeSlotCompatibility(factory),        // Minor time slot compatibility
                minorCourseDaySpread(factory),              // Minor courses spread across days
                minorCourseRoomCompatibility(factory),      // Minor room compatibility
                
                // ============================================================================
                // SOFT CONSTRAINTS - Optimization for quality (not required but preferred)
                // ============================================================================
                
                // High Priority Soft Constraints (Weight: 50)
                balanceBatchLoad(factory),                  // Even distribution of classes per batch
                balanceFacultyLoad(factory),                // Even distribution of classes per faculty
                balanceDailyBatchLoad(factory),             // Even distribution per day
                
                // Medium Priority Soft Constraints (Weight: 20)
                minimizeGapsInSchedule(factory),            // Minimize gaps between classes
                teacherIdleGapConstraint(factory),          // Minimize teacher idle time
                preferContiguousLessons(factory),           // Prefer back-to-back lessons
                
                // Low Priority Soft Constraints (Weight: 5)
                balanceRoomLoad(factory),                   // Even room utilization
                contiguousLessons(factory),                 // Contiguous lesson arrangement
                roomStability(factory),                     // Minimize room changes
                minimizeRoomChanges(factory),               // Reduce room switching
                preferredStartTime(factory),                // Prefer certain start times
                teacherMaxTwoClassesPerDayForBatch(factory) // Limit teacher classes per day per batch
        };
    }

    // ============================================================================
    // CRITICAL HARD CONSTRAINTS - These must NEVER be violated
    // ============================================================================
    
    /**
     * Room conflict: No two lessons can use the same room at the same time
     * Weight: CRITICAL (10000) - This is a hard physical constraint
     */
    private Constraint roomConflict(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getRoom),
                        Joiners.equal(Lesson::getTimeSlot))
                .filter((lesson1, lesson2) -> lesson1.getRoom() != null && lesson1.getTimeSlot() != null)
                .penalize(HardSoftScore.ONE_HARD.multiply(CRITICAL_CONFLICT_PENALTY))
                .asConstraint("Room conflict");
    }

    /**
     * Teacher conflict: No teacher can teach two classes simultaneously
     * Weight: CRITICAL (10000) - Physical impossibility
     */
    private Constraint teacherConflict(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getFaculty),
                        Joiners.equal(Lesson::getTimeSlot))
                .filter((lesson1, lesson2) -> lesson1.getFaculty() != null && lesson1.getTimeSlot() != null)
                .penalize(HardSoftScore.ONE_HARD.multiply(CRITICAL_CONFLICT_PENALTY))
                .asConstraint("Teacher conflict");
    }

    /**
     * Student group conflict: Students in the same batch cannot attend two classes simultaneously
     * Weight: CRITICAL (10000) - Physical impossibility
     */
    private Constraint studentGroupConflict(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getStudentBatch),
                        Joiners.equal(Lesson::getTimeSlot))
                .filter((lesson1, lesson2) -> lesson1.getStudentBatch() != null && lesson1.getTimeSlot() != null)
                .penalize(HardSoftScore.ONE_HARD.multiply(CRITICAL_CONFLICT_PENALTY))
                .asConstraint("Student group conflict");
    }

    /**
     * Ensure all lessons are assigned: Every lesson must have both a timeslot and a room
     * Weight: CRITICAL (10000) - Unassigned lessons make the timetable incomplete
     */
    private Constraint ensureLessonAssignments(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTimeSlot() == null || lesson.getRoom() == null)
                .penalize(HardSoftScore.ONE_HARD.multiply(CRITICAL_CONFLICT_PENALTY), lesson -> {
                    int missing = 0;
                    if (lesson.getTimeSlot() == null) missing++;
                    if (lesson.getRoom() == null) missing++;
                    return missing;
                })
                .asConstraint("Ensure lesson assignments");
    }

    // ============================================================================
    // HIGH PRIORITY HARD CONSTRAINTS
    // ============================================================================

    /**
     * Room capacity: Room must be large enough for all students
     * Weight: HIGH (1000) - Safety and comfort requirement
     */
    private Constraint roomCapacity(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getStudentBatch() != null &&
                        lesson.getRoom() != null &&
                        lesson.getStudentBatch().getStrength() > lesson.getRoom().getCapacity())
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY),
                        lesson -> lesson.getStudentBatch().getStrength() - lesson.getRoom().getCapacity())
                .asConstraint("Room capacity");
    }

    /**
     * Teacher qualification: Teacher must be qualified to teach the course
     * Weight: HIGH (1000) - Quality requirement
     */
    private Constraint teacherQualification(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getFaculty() != null &&
                        lesson.getCourse() != null &&
                        !lesson.getCourse().getEligibleFaculty().contains(lesson.getFaculty()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Teacher qualification");
    }


    // ============================================================================
    // LAB-SPECIFIC HARD CONSTRAINTS
    // ============================================================================
    
    /**
     * Weekly lab scheduling: Ensure required lab sessions per week are scheduled
     * Weight: HIGH (1000) - Curriculum requirement
     */
    private Constraint weeklyLabScheduling(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getStudentBatch() != null && 
                        lesson.getCourse() != null &&
                        lesson.getTimeSlot() != null)
                .filter(lesson -> lesson.getCourse().isLabCourse())
                .groupBy(Lesson::getStudentBatch,
                        ConstraintCollectors.countDistinct(lesson -> lesson.getTimeSlot().getDay()))
                .filter((batch, distinctDays) -> batch.getRequiredLabsPerWeek() > distinctDays)
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY),
                        (batch, distinctDays) -> batch.getRequiredLabsPerWeek() - distinctDays)
                .asConstraint("Weekly lab scheduling");
    }

    /**
     * Lab room assignment: Lab courses must be in lab rooms (computer or hardware labs)
     * Weight: HIGH (1000) - Equipment requirement
     */
    private Constraint labRoomAssignment(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getCourse() != null &&
                        lesson.getRoom() != null &&
                        lesson.getCourse().isLabCourse() &&
                        !isLabRoom(lesson.getRoom()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Lab room assignment");
    }

    /**
     * Only one lab per batch per day: Limit lab sessions for better learning
     * Weight: HIGH (1000) - Pedagogical requirement
     */
    private Constraint onlyOneLabPerBatchPerDay(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getCourse() != null &&
                        lesson.getTimeSlot() != null &&
                        lesson.getCourse().isLabCourse())
                .groupBy(Lesson::getStudentBatch,
                        lesson -> lesson.getTimeSlot().getDay(),
                        ConstraintCollectors.count())
                .filter((batch, day, count) -> count > 1)
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY),
                        (batch, day, count) -> (count - 1) * 2)  // Escalating penalty
                .asConstraint("Only one lab per batch per day");
    }

    /**
     * Only lab courses in lab rooms: Preserve lab resources for lab courses
     * Weight: HIGH (1000) - Resource optimization
     */
    private Constraint onlyLabCoursesInLabRooms(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getCourse() != null &&
                        lesson.getRoom() != null &&
                        !lesson.getCourse().isLabCourse() &&
                        isLabRoom(lesson.getRoom()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Only lab courses in lab rooms");
    }

    /**
     * Lecture in regular rooms: Lectures should not occupy lab rooms
     * Weight: HIGH (1000) - Resource optimization (duplicate of above for clarity)
     */
    private Constraint lectureInRegularRooms(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getCourse() != null &&
                        lesson.getRoom() != null &&
                        !lesson.getCourse().isLabCourse() &&
                        isLabRoom(lesson.getRoom()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Lecture in regular rooms");
    }

    /**
     * Predefined room assignment: Batches must use their designated rooms
     * Weight: MEDIUM (100) - Administrative requirement
     */
    private Constraint predefinedRoomAssignment(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getRoom() != null && lesson.getStudentBatch() != null)
                .filter(lesson -> !isRoomAllowedForBatch(lesson.getRoom(), lesson.getStudentBatch()))
                .penalize(HardSoftScore.ONE_HARD.multiply(MEDIUM_PRIORITY_PENALTY))
                .asConstraint("Predefined room assignment");
    }

    private boolean isRoomAllowedForBatch(Room room, StudentBatch batch) {
                if (room == null || batch == null) return true;

        if (room.isLectureRoom()) {
            return batch.getLectureRoomIDs().contains(room.getId());
        } else if (room.isLabRoom()) {
            return batch.getPracticalRoomIDs().contains(room.getId());
        }
        return false;
    }

    /**
     * No classes during lunch hour: Respect lunch break for each year
     * Weight: HIGH (1000) - Wellbeing requirement
     */
    private Constraint noClassesDuringLunchHour(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTimeSlot() != null && lesson.getStudentBatch() != null)
                .filter(lesson -> isLunchHourForYear(lesson))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("No classes during lunch hour per year group");
    }

    private boolean isLunchHourForYear(Lesson lesson) {
        if (lesson.getStudentBatch() == null) return false;

        int year = lesson.getStudentBatch().getYear();
        LocalTime startTime = lesson.getTimeSlot().getStartTime();

        // Use configuration holder to check lunch hours dynamically
        // This replaces hardcoded lunch time checks with dynamic configuration
        return ConstraintConfigurationHolder.getInstance()
                .isLunchHourForYear(year, startTime);
    }

    private Integer  extractYearFromBatch(StudentBatch batch) {
        if (batch == null) {
            return null;
        }
        return batch.getYear();
    }

    /**
     * Single course per day for batch: Each batch should have at most one session per course per day
     * Weight: MEDIUM (100) - Pedagogical preference
     */
    private Constraint singleCoursePerDayForBatch(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getStudentBatch() != null && 
                        lesson.getTimeSlot() != null && 
                        lesson.getCourse() != null)
                .groupBy(Lesson::getStudentBatch,
                        lesson -> lesson.getTimeSlot().getDay(),
                        lesson -> lesson.getCourse(),
                        ConstraintCollectors.count())
                .filter((batch, day, course, count) -> count > 1)
                .penalize(HardSoftScore.ONE_HARD.multiply(MEDIUM_PRIORITY_PENALTY),
                        (batch, day, course, count) -> (count - 1) * 2)  // Escalating penalty
                .asConstraint("Single course per day for batch");
    }

    /**
     * Lab time slot constraint: Labs must be in designated lab time slots
     * Weight: MEDIUM (100) - Scheduling requirement
     */
    private Constraint labTimeSlotConstraint(ConstraintFactory constraintFactory) {
        return constraintFactory.from(Lesson.class)
                .filter(lesson -> lesson.getTimeSlot() != null && 
                        lesson.getStudentBatch() != null &&
                        "LAB".equals(lesson.getLessonType()))
                .filter(lesson -> !isLabInCorrectTimeSlot(lesson))
                .penalize("Lab classes must be scheduled in designated time slots per batch",
                        HardSoftScore.ONE_HARD.multiply(MEDIUM_PRIORITY_PENALTY));
    }

    private boolean isLabInCorrectTimeSlot(Lesson lesson) {
        TimeSlot timeSlot = lesson.getTimeSlot();
        if (timeSlot == null) return false;

        Integer batchYear = extractYearFromBatch(lesson.getStudentBatch());
        if (batchYear == null) return false;
        
        LocalTime startTime = timeSlot.getStartTime();
        LocalTime endTime = timeSlot.getEndTime();

        // Use configuration holder to check if lab time slot is valid for batch
        // This replaces hardcoded time slot checks with dynamic configuration
        return ConstraintConfigurationHolder.getInstance()
                .isLabTimeSlotValidForBatch(batchYear, startTime, endTime);
    }

    /**
     * Teacher max two classes per day for batch: Limit teacher's classes per batch per day
     * Weight: SOFT_LOW (5) - Pedagogical preference
     */
    private Constraint teacherMaxTwoClassesPerDayForBatch(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getFaculty() != null &&
                        lesson.getStudentBatch() != null &&
                        lesson.getTimeSlot() != null)
                .groupBy(
                        Lesson::getFaculty,
                        Lesson::getStudentBatch,
                        lesson -> lesson.getTimeSlot().getDay(),
                        ConstraintCollectors.count()
                )
                .filter((teacher, batch, day, classCount) -> classCount > 2)
                .penalize(
                        HardSoftScore.ONE_SOFT.multiply(SOFT_LOW_PRIORITY),
                        (teacher, batch, day, classCount) -> (classCount - 2) * 2  // Escalating penalty
                )
                .asConstraint("Max two classes per day for a teacher per batch");
    }

    // ============================================================================
    // MEDIUM PRIORITY SOFT CONSTRAINTS - Schedule quality
    // ============================================================================
    
    /**
     * Limit teacher idle gaps: Minimize gaps in teacher schedules
     * Weight: SOFT_MEDIUM (20) - Efficiency improvement
     */
    private Constraint teacherIdleGapConstraint(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getFaculty),
                        Joiners.equal(lesson -> lesson.getTimeSlot() != null ? lesson.getTimeSlot().getDay() : null))
                .filter(this::validateTeacherGaps)
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_MEDIUM_PRIORITY),
                        (lesson1, lesson2) -> calculateTimeGap(lesson1, lesson2) / 10)  // Scale down the penalty
                .asConstraint("Limit teacher idle gaps");
    }


    // ============================================================================
    // HIGH PRIORITY SOFT CONSTRAINTS - Important for quality
    // ============================================================================
    
    /**
     * Balance batch load: Distribute lessons evenly across batches
     * Weight: SOFT_HIGH (50) - Important for fairness
     */
    private Constraint balanceBatchLoad(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getStudentBatch() != null)
                .groupBy(Lesson::getStudentBatch, ConstraintCollectors.count())
                .filter((batch, count) -> count < MIN_CLASSES_PER_BATCH || count > MAX_CLASSES_PER_BATCH)
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_HIGH_PRIORITY),
                        (batch, count) -> Math.abs(count - ((MIN_CLASSES_PER_BATCH + MAX_CLASSES_PER_BATCH) / 2)))
                .asConstraint("Balance batch load");
    }

    /**
     * Balance faculty load: Distribute teaching load evenly across faculty
     * Weight: SOFT_HIGH (50) - Important for fairness
     */
    private Constraint balanceFacultyLoad(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getFaculty() != null)
                .groupBy(Lesson::getFaculty, ConstraintCollectors.count())
                .filter((faculty, count) -> Math.abs(count - TARGET_FACULTY_LESSONS) > 2)
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_HIGH_PRIORITY),
                        (faculty, count) -> Math.abs(count - TARGET_FACULTY_LESSONS))
                .asConstraint("Balance faculty load");
    }

    /**
     * Balance room load: Distribute room usage evenly
     * Weight: SOFT_LOW (5) - Nice to have
     */
    private Constraint balanceRoomLoad(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getRoom() != null)
                .groupBy(Lesson::getRoom, ConstraintCollectors.count())
                .filter((room, count) ->
                        room != null &&
                        (count > room.getIdealDailyUsage() ||
                                count < Math.max(1, room.getIdealDailyUsage() - 1)))
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_LOW_PRIORITY),
                        (room, count) -> Math.abs(count - room.getIdealDailyUsage()))
                .asConstraint("Balance room load");
    }

//    // Preference and Convenience Soft Constraints
//    private Constraint teacherPreferredTimeslot(ConstraintFactory factory) {
//        return factory.forEach(Lesson.class)
//                .filter(lesson -> !lesson.getFaculty().getPreferredSlots().contains(lesson.getTimeSlot()))
//                .penalize(HardSoftScore.ONE_SOFT)
//                .asConstraint("Teacher preferred timeslot");
//    }

//    private Constraint teacherPreferredTimeslot(ConstraintFactory factory) {
//        return factory.forEach(Lesson.class)
//                .filter(lesson -> {
//                    // Null safety checks
//                    Faculty faculty = lesson.getFaculty();
//                    TimeSlot timeSlot = lesson.getTimeSlot();
//                    if (faculty == null || timeSlot == null) return false;
//
//                    List<TimeSlot> preferredSlots = faculty.getPreferredSlots();
//                    return preferredSlots != null && !preferredSlots.contains(timeSlot);
//                })
//                .penalize(HardSoftScore.ONE_SOFT)
//                .asConstraint("Teacher preferred timeslot");
//    }

//    private Constraint consecutiveLectures(ConstraintFactory factory) {
//        return factory.forEachUniquePair(Lesson.class,
//                        Joiners.equal(Lesson::getStudentBatch),
//                        Joiners.equal(lesson -> lesson.getTimeSlot().getDay()))
//                .filter((lesson1, lesson2) -> isConsecutive(lesson1, lesson2))
//                .reward(HardSoftScore.ONE_SOFT)
//                .asConstraint("Consecutive lectures");
//    }

    /**
     * Minimize gaps in schedule: Reduce time gaps between consecutive lessons
     * Weight: SOFT_MEDIUM (20) - Student convenience
     */
    private Constraint minimizeGapsInSchedule(ConstraintFactory factory) {
        ConstraintConfigurationHolder holder = ConstraintConfigurationHolder.getInstance();
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getStudentBatch),
                        Joiners.equal(lesson -> lesson.getTimeSlot() != null ? lesson.getTimeSlot().getDay() : null))
                .filter((lesson1, lesson2) -> 
                        lesson1.getTimeSlot() != null && lesson2.getTimeSlot() != null)
                .filter((lesson1, lesson2) ->
                        ChronoUnit.MINUTES.between(
                                lesson1.getTimeSlot().getEndTime(),
                                lesson2.getTimeSlot().getStartTime()) >
                                Math.max(holder.getMaxGapMinutes(), DEFAULT_MAX_GAP_MINUTES))
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_MEDIUM_PRIORITY),
                        (lesson1, lesson2) -> (int) ChronoUnit.MINUTES.between(
                                lesson1.getTimeSlot().getEndTime(),
                                lesson2.getTimeSlot().getStartTime()) / 15)  // Scale penalty
                .asConstraint("Minimize gaps in schedule");
    }

    /**
     * Prefer contiguous lessons: Reward back-to-back lessons
     * Weight: SOFT_MEDIUM (20) - Learning efficiency
     */
    private Constraint preferContiguousLessons(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getStudentBatch),
                        Joiners.equal(lesson -> lesson.getTimeSlot() != null ? lesson.getTimeSlot().getDay() : null))
                .filter((lesson1, lesson2) -> 
                        lesson1.getTimeSlot() != null && lesson2.getTimeSlot() != null)
                .filter((lesson1, lesson2) -> isConsecutive(lesson1, lesson2))
                .reward(HardSoftScore.ONE_SOFT.multiply(SOFT_MEDIUM_PRIORITY))
                .asConstraint("Prefer contiguous lessons");
    }

    // ============================================================================
    // LOW PRIORITY SOFT CONSTRAINTS - Nice to have
    // ============================================================================
    
    /**
     * Room stability: Minimize room changes for consecutive lessons
     * Weight: SOFT_LOW (5) - Convenience
     */
    private Constraint roomStability(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getStudentBatch),
                        Joiners.equal(lesson -> lesson.getTimeSlot() != null ? lesson.getTimeSlot().getDay() : null))
                .filter((lesson1, lesson2) -> 
                        lesson1.getRoom() != null && 
                        lesson2.getRoom() != null &&
                        lesson1.getTimeSlot() != null && 
                        lesson2.getTimeSlot() != null)
                .filter((lesson1, lesson2) -> isConsecutive(lesson1, lesson2))
                .filter((lesson1, lesson2) -> !lesson1.getRoom().equals(lesson2.getRoom()))
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_LOW_PRIORITY))
                .asConstraint("Room stability");
    }

    /**
     * Minimize room changes: Reduce room switching within short time periods
     * Weight: SOFT_LOW (5) - Convenience
     */
    private Constraint minimizeRoomChanges(ConstraintFactory factory) {
        ConstraintConfigurationHolder holder = ConstraintConfigurationHolder.getInstance();
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getStudentBatch),
                        Joiners.equal(lesson -> lesson.getTimeSlot() != null ? lesson.getTimeSlot().getDay() : null))
                .filter((lesson1, lesson2) -> 
                        lesson1.getRoom() != null && 
                        lesson2.getRoom() != null &&
                        lesson1.getTimeSlot() != null && 
                        lesson2.getTimeSlot() != null)
                .filter((lesson1, lesson2) ->
                        Math.abs(ChronoUnit.MINUTES.between(
                                lesson1.getTimeSlot().getEndTime(),
                                lesson2.getTimeSlot().getStartTime())) <=
                                Math.max(holder.getMaxGapMinutes(), DEFAULT_MAX_GAP_MINUTES))
                .filter((lesson1, lesson2) -> !lesson1.getRoom().equals(lesson2.getRoom()))
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_LOW_PRIORITY))
                .asConstraint("Minimize room changes");
    }

    /**
     * Preferred start time: Prefer lessons to start at configured times
     * Weight: SOFT_LOW (5) - Minor preference
     */
    private Constraint preferredStartTime(ConstraintFactory factory) {
        ConstraintConfigurationHolder holder = ConstraintConfigurationHolder.getInstance();
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTimeSlot() != null)
                .filter(lesson -> {
                    LocalTime preferred = holder.getPreferredStartTime();
                    LocalTime startTime = lesson.getTimeSlot().getStartTime();
                    return preferred != null && startTime != null && !startTime.equals(preferred);
                })
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_LOW_PRIORITY),
                        lesson -> {
                            LocalTime preferred = holder.getPreferredStartTime();
                            LocalTime startTime = lesson.getTimeSlot().getStartTime();
                            if (preferred == null || startTime == null) {
                                return 0;
                            }
                            return (int) Math.abs(ChronoUnit.MINUTES.between(
                                    preferred,
                                    startTime)) / 30;  // Scale penalty
                        })
                .asConstraint("Preferred start time");
    }

    /**
     * Balance daily batch load: Distribute lessons evenly across days
     * Weight: SOFT_HIGH (50) - Important for student wellbeing
     */
    private Constraint balanceDailyBatchLoad(ConstraintFactory factory) {
        ConstraintConfigurationHolder holder = ConstraintConfigurationHolder.getInstance();
        final int configuredTarget = holder.getTargetDailyLessonsPerBatch();
        final int configuredVariance = holder.getAllowedDailyLessonsVariance();
        final int target = Math.max(configuredTarget, DEFAULT_TARGET_DAILY_LESSONS);
        final int variance = Math.max(configuredVariance, DEFAULT_ALLOWED_VARIANCE);
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getStudentBatch() != null && lesson.getTimeSlot() != null)
                .groupBy(Lesson::getStudentBatch,
                        lesson -> lesson.getTimeSlot().getDay(),
                        ConstraintCollectors.count())
                .filter((batch, day, count) -> Math.abs(count - target) > variance)
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_HIGH_PRIORITY),
                        (batch, day, count) -> Math.abs(count - target))
                .asConstraint("Balance daily batch load");
    }

    /**
     * Contiguous lessons: Penalize small gaps between lessons
     * Weight: SOFT_LOW (5) - Minor optimization
     */
    private Constraint contiguousLessons(ConstraintFactory factory) {
        ConstraintConfigurationHolder holder = ConstraintConfigurationHolder.getInstance();
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getStudentBatch),
                        Joiners.equal(lesson -> lesson.getTimeSlot() != null ? lesson.getTimeSlot().getDay() : null))
                .filter((lesson1, lesson2) -> 
                        lesson1.getTimeSlot() != null && lesson2.getTimeSlot() != null)
                .filter((lesson1, lesson2) -> !isConsecutive(lesson1, lesson2))
                .filter((lesson1, lesson2) ->
                        Math.abs(ChronoUnit.MINUTES.between(
                                lesson1.getTimeSlot().getEndTime(),
                                lesson2.getTimeSlot().getStartTime())) <=
                                Math.max(holder.getMaxGapMinutes(), DEFAULT_MAX_GAP_MINUTES))
                .penalize(HardSoftScore.ONE_SOFT.multiply(SOFT_LOW_PRIORITY),
                        (lesson1, lesson2) -> (int) Math.abs(ChronoUnit.MINUTES.between(
                                lesson1.getTimeSlot().getEndTime(),
                                lesson2.getTimeSlot().getStartTime())) / 10)  // Scale penalty
                .asConstraint("Contiguous lessons");
    }

    // Utility methods
    private boolean isLabRoom(Room room) {
        if (room == null) {
            return false;
        }
        return room.getType() == RoomType.COMPUTER_LAB ||
                room.getType() == RoomType.HARDWARE_LAB;
    }

    private boolean isConsecutive(Lesson lesson1, Lesson lesson2) {
        LocalTime endTime1 = lesson1.getTimeSlot().getEndTime();
        LocalTime startTime2 = lesson2.getTimeSlot().getStartTime();
        int bufferMinutes = Math.max(ConstraintConfigurationHolder.getInstance().getConsecutiveLessonBufferMinutes(), 0);
        return endTime1.equals(startTime2) ||
                ChronoUnit.MINUTES.between(endTime1, startTime2) <= bufferMinutes;
    }

    // ============================================================================
    // MINOR COURSE HARD CONSTRAINTS
    // ============================================================================
    
    /**
     * Minor valid room: Minor courses must be in designated rooms
     * Weight: HIGH (1000) - Administrative requirement
     */
    private Constraint minorValidRoom(ConstraintFactory constraintFactory) {
        return constraintFactory.from(Lesson.class)
                .filter(lesson -> lesson.getCourse() != null && 
                        lesson.getRoom() != null &&
                        "minor".equals(lesson.getCourse().getCourseType()))
                .filter(lesson -> !lesson.getCourse().getLectureRoomIDs().contains(lesson.getRoom().getId()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Minors must be assigned to valid rooms");
    }

    /**
     * Minor fixed timeslot: Minor courses must be in configured time slots
     * Weight: HIGH (1000) - Scheduling requirement
     */
    private Constraint minorFixedTimeslot(ConstraintFactory constraintFactory) {
        return constraintFactory.from(Lesson.class)
                .filter(lesson -> lesson.getCourse() != null && 
                        lesson.getTimeSlot() != null &&
                        "minor".equals(lesson.getCourse().getCourseType()))
                .filter(lesson -> !ConstraintConfigurationHolder.getInstance().isMinorTimeSlotValid(
                                lesson.getTimeSlot().getStartTime(),
                                lesson.getTimeSlot().getEndTime(),
                                lesson.getTimeSlot().getSlotType()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Minor courses must be scheduled in configured slots");
    }

    /**
     * No room conflict for minors: Prevent double-booking of minor course rooms
     * Weight: CRITICAL (10000) - Absolute conflict
     */
    private Constraint noRoomConflictForMinors(ConstraintFactory constraintFactory) {
        return constraintFactory.from(Lesson.class)
                .filter(lesson -> lesson.getCourse() != null && 
                        lesson.getRoom() != null && 
                        lesson.getTimeSlot() != null &&
                        "minor".equals(lesson.getCourse().getCourseType()))
                .join(Lesson.class,
                        Joiners.equal(Lesson::getRoom),
                        Joiners.equal(Lesson::getTimeSlot))
                .filter((lesson1, lesson2) -> !lesson1.equals(lesson2))
                .penalize(HardSoftScore.ONE_HARD.multiply(CRITICAL_CONFLICT_PENALTY))
                .asConstraint("No room conflicts for minors");
    }

    /**
     * Lecture duration constraint: Lectures must match lecture time slot durations
     * Weight: HIGH (1000) - Structural requirement
     */
    private Constraint lectureDurationConstraint(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTimeSlot() != null && lesson.getLessonType() != null)
                .filter(lesson -> "LECTURE".equalsIgnoreCase(lesson.getLessonType()) &&
                        !"LECTURE".equalsIgnoreCase(lesson.getTimeSlot().getSlotType()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Lecture classes should match lecture time slots");
    }

    /**
     * Lab duration constraint: Labs must match lab time slot durations
     * Weight: HIGH (1000) - Structural requirement
     */
    private Constraint labDurationConstraint(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTimeSlot() != null && lesson.getLessonType() != null)
                .filter(lesson -> "LAB".equalsIgnoreCase(lesson.getLessonType()) &&
                        !"LAB".equalsIgnoreCase(lesson.getTimeSlot().getSlotType()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Lab classes must match lab time slots");
    }

    /**
     * Lab room constraint: Lab time slots must use practical rooms
     * Weight: HIGH (1000) - Resource requirement
     */
    private Constraint labRoomConstraint(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTimeSlot() != null &&
                        lesson.getRoom() != null &&
                        lesson.getStudentBatch() != null &&
                        "LAB".equalsIgnoreCase(lesson.getTimeSlot().getSlotType()))
                .filter(lesson -> !"LAB".equalsIgnoreCase(lesson.getLessonType()) ||
                                !lesson.getStudentBatch().getPracticalRoomIDs().contains(lesson.getRoom().getId()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Two hour slots must be LAB type in practical rooms");
    }

    /**
     * Lecture room constraint: Lecture time slots must use lecture rooms
     * Weight: HIGH (1000) - Resource requirement
     */
    private Constraint lectureRoomConstraint(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTimeSlot() != null &&
                        lesson.getRoom() != null &&
                        lesson.getStudentBatch() != null &&
                        "LECTURE".equalsIgnoreCase(lesson.getTimeSlot().getSlotType()))
                .filter(lesson -> !"LECTURE".equalsIgnoreCase(lesson.getLessonType()) ||
                                !lesson.getStudentBatch().getLectureRoomIDs().contains(lesson.getRoom().getId()))
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("Sessions under 2 hours must be LECTURE type in lecture rooms");
    }

    /**
     * Faculty time conflict: Detect overlapping or interleaved faculty schedules
     * Weight: CRITICAL (10000) - Physical impossibility
     */
    private Constraint facultyTimeConflictConstraint(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getFaculty),
                        Joiners.equal(l -> l.getTimeSlot() != null ? l.getTimeSlot().getDay() : null))
                .filter((lesson1, lesson2) -> {
                    // Comprehensive null checks
                    if (lesson1.getFaculty() == null || lesson2.getFaculty() == null ||
                            lesson1.getTimeSlot() == null || lesson2.getTimeSlot() == null) {
                        return false;
                    }

                    return isTimeSlotOverlapping(lesson1.getTimeSlot(), lesson2.getTimeSlot()) ||
                            isInterwokenTimeSlot(lesson1.getTimeSlot(), lesson2.getTimeSlot()) ||
                            isInsufficientBreakBetweenClasses(lesson1.getTimeSlot(), lesson2.getTimeSlot());
                })
                .penalize(HardSoftScore.ONE_HARD.multiply(CRITICAL_CONFLICT_PENALTY))
                .asConstraint("Faculty Time Conflict");
    }

    /**
     * Faculty multi-batch constraint: Faculty cannot teach multiple batches at the same time
     * Weight: CRITICAL (10000) - Physical impossibility
     */
    private Constraint facultyMultiBatchConstraint(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getFaculty),
                        Joiners.equal(Lesson::getTimeSlot))
                .filter((lesson1, lesson2) -> {
                    // Consolidated null and conflict checks
                    return lesson1.getStudentBatch() != null &&
                            lesson2.getStudentBatch() != null &&
                            lesson1.getFaculty() != null &&
                            lesson2.getFaculty() != null &&
                            lesson1.getTimeSlot() != null &&
                            !lesson1.equals(lesson2) &&
                            !lesson1.getStudentBatch().equals(lesson2.getStudentBatch());
                })
                .penalize(HardSoftScore.ONE_HARD.multiply(CRITICAL_CONFLICT_PENALTY))
                .asConstraint("Faculty Teaching Multiple Batches Simultaneously");
    }



//    private Constraint consecutiveClassConstraint(ConstraintFactory factory) {
//        return factory.forEachUniquePair(Lesson.class,
//                        Joiners.equal(l -> l.getCourse()),
//                        Joiners.equal(l -> l.getStudentBatch()),
//                        Joiners.equal(l -> l.getTimeSlot() != null ? l.getTimeSlot().getDay() : null))
//                .filter((lesson1, lesson2) -> {
//                    // Comprehensive null and time difference checks
//                    if (lesson1 == null || lesson2 == null ||
//                            lesson1.getTimeSlot() == null || lesson2.getTimeSlot() == null ||
//                            lesson1.getStudentBatch() == null || lesson2.getStudentBatch() == null ||
//                            lesson1.getCourse() == null || lesson2.getCourse() == null) {
//                        return false;
//                    }
//
//                    // Ensure time slots are different
//                    if (lesson1.getTimeSlot().equals(lesson2.getTimeSlot())) {
//                        return false;
//                    }
//
//                    // Optimize time difference calculation
//                    long timeDifference = Math.abs(Duration.between(
//                            lesson1.getTimeSlot().getEndTime(),
//                            lesson2.getTimeSlot().getStartTime()
//                    ).toMinutes());
//
//                    // Penalize if time between same subject classes is more than 1.5 hours
//                    return timeDifference > DEFAULT_MAX_TEACHER_GAP_MINUTES;
//                })
//                .penalize(HardSoftScore.ONE_SOFT)
//                .asConstraint("Consecutive Subject Class Spacing");
//    }






    // Helper Methods
    private boolean isTimeSlotOverlapping(TimeSlot slot1, TimeSlot slot2) {
        if (slot1 == null || slot2 == null) return false;
        return !(slot1.getEndTime().isBefore(slot2.getStartTime()) ||
                slot1.getStartTime().isAfter(slot2.getEndTime()));
    }

    private boolean isInterwokenTimeSlot(TimeSlot slot1, TimeSlot slot2) {
        LocalTime start1 = slot1.getStartTime();
        LocalTime end1 = slot1.getEndTime();
        LocalTime start2 = slot2.getStartTime();
        LocalTime end2 = slot2.getEndTime();

        return (start2.isAfter(start1) && start2.isBefore(end1)) ||
                (end2.isAfter(start1) && end2.isBefore(end1)) ||
                (start1.isAfter(start2) && start1.isBefore(end2)) ||
                (end1.isAfter(start2) && end1.isBefore(end2));
    }

    private boolean isInsufficientBreakBetweenClasses(TimeSlot slot1, TimeSlot slot2) {
        Duration timeBetweenClasses = Duration.between(
                slot1.getEndTime(),
                slot2.getStartTime()
        );
                int minimumBreak = Math.max(ConstraintConfigurationHolder.getInstance().getMinimumBreakBetweenClassesMinutes(), 0);
                return Math.abs(timeBetweenClasses.toMinutes()) < minimumBreak;
    }

    /**
     * Student batch conflict: Enhanced detection of time overlaps and interleaving
     * Weight: CRITICAL (10000) - Physical impossibility
     */
    private Constraint studentBatchConflict(ConstraintFactory factory) {
        return factory.forEachUniquePair(Lesson.class,
                        Joiners.equal(Lesson::getStudentBatch))
                .filter((lesson1, lesson2) -> {
                    // Null safety and day check
                    TimeSlot slot1 = lesson1.getTimeSlot();
                    TimeSlot slot2 = lesson2.getTimeSlot();

                    return slot1 != null &&
                            slot2 != null &&
                            slot1.getDay().equals(slot2.getDay()) &&
                            (isTimeSlotOverlapping(slot1, slot2) ||
                                    isInterwokenTimeSlot(slot1, slot2));
                })
                .penalize(HardSoftScore.ONE_HARD.multiply(CRITICAL_CONFLICT_PENALTY))
                .asConstraint("Student batch time conflict");
    }

    /**
     * Minor time slot compatibility: Minor courses must be in minor-designated time slots
     * Weight: HIGH (1000) - Administrative requirement
     */
    private Constraint minorTimeSlotCompatibility(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(Lesson.class)
                .filter(lesson ->
                        lesson.getTimeSlot() != null &&
                                "MINOR".equals(lesson.getLessonType()) &&
                                !isValidMinorTimeSlot(lesson.getTimeSlot())
                )
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("MinorTimeSlotCompatibility");
    }

    /**
     * Minor course day spread: Spread minor course sessions across different days
     * Weight: HIGH (1000) - Pedagogical requirement
     */
    private Constraint minorCourseDaySpread(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(Lesson.class)
                .filter((lesson1, lesson2) ->
                        lesson1.getCourse() != null &&
                                lesson2.getCourse() != null &&
                                lesson1.getTimeSlot() != null &&
                                lesson2.getTimeSlot() != null &&
                                "MINOR".equals(lesson1.getLessonType()) &&
                                "MINOR".equals(lesson2.getLessonType()) &&
                                lesson1.getCourse().equals(lesson2.getCourse()) &&
                                lesson1.getTimeSlot().getDay().equals(lesson2.getTimeSlot().getDay())
                )
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("MinorCourseDaySpread");
    }

    /**
     * Minor course room compatibility: Minor courses must use designated rooms
     * Weight: HIGH (1000) - Resource requirement
     */
    private Constraint minorCourseRoomCompatibility(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(Lesson.class)
                .filter(lesson ->
                        lesson.getRoom() != null &&
                                "MINOR".equals(lesson.getLessonType()) &&
                                !isValidMinorRoom(lesson)
                )
                .penalize(HardSoftScore.ONE_HARD.multiply(HIGH_PRIORITY_PENALTY))
                .asConstraint("MinorCourseRoomCompatibility");
    }

    /**
     * Batch time slot compatibility: Regular batches must use appropriate time slots
     * Weight: MEDIUM (100) - Scheduling requirement
     */
    private Constraint batchTimeSlotCompatibility(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(Lesson.class)
                .filter(lesson ->
                        lesson.getTimeSlot() != null &&
                                lesson.getStudentBatch() != null &&
                                !"MINOR".equals(lesson.getLessonType()) &&
                                !isTimeSlotValidForBatch(lesson.getStudentBatch(), lesson.getTimeSlot())
                )
                .penalize(HardSoftScore.ONE_HARD.multiply(MEDIUM_PRIORITY_PENALTY))
                .asConstraint("BatchTimeSlotCompatibility");
    }

    // Helper method to check if a time slot is valid for minor courses
    private boolean isValidMinorTimeSlot(TimeSlot slot) {
        if (slot == null) return false;
        
        // Use configuration holder to validate minor time slots dynamically
        // This replaces hardcoded minor time slot checks with dynamic configuration
        return ConstraintConfigurationHolder.getInstance()
                .isMinorTimeSlotValid(slot.getStartTime(), slot.getEndTime(), slot.getSlotType());
    }

    // Helper method to check if a room is valid for a minor course
    private boolean isValidMinorRoom(Lesson lesson) {
        return lesson.getCourse() != null &&
                lesson.getRoom() != null &&
                lesson.getCourse().getLectureRoomIDs().contains(lesson.getRoom().getId());
    }

    // Original time slot validation for regular batches
    private boolean isTimeSlotValidForBatch(StudentBatch batch, TimeSlot slot) {
        if (slot.getSlotType().equals("MINOR")) {
            return false;  // Regular batches should not get minor slots
        }

        int batchYear = batch.getYear();
        LocalTime startTime = slot.getStartTime();
        LocalTime endTime = slot.getEndTime();
        String slotType = slot.getSlotType();

        // Use configuration holder to validate time slots dynamically
        // This replaces hardcoded time slot validations with dynamic configuration
        return ConstraintConfigurationHolder.getInstance()
                .isTimeSlotValidForBatch(batchYear, startTime, endTime, slotType);
    }

    private LocalTime getStartTime(Lesson lesson) {
        return lesson.getTimeSlot().getStartTime();
    }

    private LocalTime getEndTime(Lesson lesson) {
        return lesson.getTimeSlot().getEndTime();
    }


    private boolean hasTimeGap(Lesson lesson1, Lesson lesson2) {
        int gap = calculateTimeGap(lesson1, lesson2);
        if (gap <= 0) {
            return false;
        }
        int maxGap = Math.max(ConstraintConfigurationHolder.getInstance().getMaxGapMinutes(), DEFAULT_MAX_GAP_MINUTES);
        return gap > maxGap;
    }

    private int calculateTimeGap(Lesson lesson1, Lesson lesson2) {
        if (lesson1 == null || lesson2 == null) {
            return 0;
        }
        TimeSlot slot1 = lesson1.getTimeSlot();
        TimeSlot slot2 = lesson2.getTimeSlot();
        if (slot1 == null || slot2 == null) {
            return 0;
        }

        Lesson earlierLesson = slot1.getStartTime().isBefore(slot2.getStartTime()) ? lesson1 : lesson2;
        Lesson laterLesson = earlierLesson == lesson1 ? lesson2 : lesson1;

        long gap = ChronoUnit.MINUTES.between(
                earlierLesson.getTimeSlot().getEndTime(),
                laterLesson.getTimeSlot().getStartTime());

        return gap > 0 ? (int) gap : 0;
    }

    private boolean validateTeacherGaps(Lesson lesson1, Lesson lesson2) {
        if (lesson1 == null || lesson2 == null) {
            return false;
        }
        if (lesson1.getFaculty() == null || lesson2.getFaculty() == null) {
            return false;
        }
        if (lesson1.getTimeSlot() == null || lesson2.getTimeSlot() == null) {
            return false;
        }
        if (!lesson1.getFaculty().equals(lesson2.getFaculty())) {
            return false;
        }
        if (!isSameDay(lesson1, lesson2)) {
            return false;
        }

        int gap = calculateTimeGap(lesson1, lesson2);
        if (gap <= 0) {
            return false;
        }

        int allowedGap = Math.max(
                ConstraintConfigurationHolder.getInstance().getMaxTeacherGapMinutes(),
                DEFAULT_MAX_TEACHER_GAP_MINUTES);

        return gap > allowedGap;
    }

    private boolean isSameDay(Lesson lesson1, Lesson lesson2) {
        return lesson1.getTimeSlot().getDay().equals(lesson2.getTimeSlot().getDay());
    }

    private boolean isOverlapping(Lesson lesson1, Lesson lesson2) {
        LocalTime start1 = getStartTime(lesson1);
        LocalTime end1 = getEndTime(lesson1);
        LocalTime start2 = getStartTime(lesson2);
        LocalTime end2 = getEndTime(lesson2);

        return (start1.isBefore(end2) || start1.equals(end2)) &&
                (start2.isBefore(end1) || start2.equals(end1));
    }
}