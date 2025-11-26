package com.timetable.util;

import com.timetable.domain.*;
import java.time.LocalTime;
import java.util.List;

/**
 * Thread-safe singleton holder for configuration data used by the constraint provider.
 * This allows the constraint provider to access dynamic configuration without hardcoding values.
 */
public class ConstraintConfigurationHolder {
    
    private static volatile ConstraintConfigurationHolder instance;
    private TimeSlotConfiguration timeSlotConfiguration;
    private BatchYearMapping batchYearMapping;
    
    private ConstraintConfigurationHolder() {
        // Private constructor for singleton
    }
    
    public static ConstraintConfigurationHolder getInstance() {
        if (instance == null) {
            synchronized (ConstraintConfigurationHolder.class) {
                if (instance == null) {
                    instance = new ConstraintConfigurationHolder();
                }
            }
        }
        return instance;
    }
    
    public void setTimeSlotConfiguration(TimeSlotConfiguration config) {
        this.timeSlotConfiguration = config;
        if (config != null) {
            this.batchYearMapping = config.getBatchYearMapping();
        }
    }
    
    public TimeSlotConfiguration getTimeSlotConfiguration() {
        return timeSlotConfiguration;
    }
    
    public BatchYearMapping getBatchYearMapping() {
        return batchYearMapping;
    }
    
    /**
     * Check if a lab time slot is valid for a specific batch year
     */
    public boolean isLabTimeSlotValidForBatch(int batchYear, LocalTime startTime, LocalTime endTime) {
        if (timeSlotConfiguration == null || batchYearMapping == null) {
            return false; // Fallback to false if not configured
        }
        
        // Get the year level (1-4) from batch year
        Integer yearLevel = batchYearMapping.getYearLevelFromBatchYear(batchYear);
        if (yearLevel == null) {
            return false;
        }
        
        // Get the appropriate year's slots
        List<TimeSlotDefinition> slots = getSlotsByYearLevel(yearLevel);
        if (slots == null) {
            return false;
        }
        
        // Check if the time matches any LAB slot
        for (TimeSlotDefinition slot : slots) {
            LocalTime slotStart = slot.getStartTimeAsLocalTime();
            LocalTime slotEnd = slot.getEndTimeAsLocalTime();
            if ("LAB".equalsIgnoreCase(slot.getSlotType()) &&
                startTime.equals(slotStart) &&
                endTime.equals(slotEnd)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if a time slot is valid for a specific batch year
     */
    public boolean isTimeSlotValidForBatch(int batchYear, LocalTime startTime, LocalTime endTime, String slotType) {
        if (timeSlotConfiguration == null || batchYearMapping == null) {
            return true; // Fallback to allow if not configured
        }
        
        // Don't allow regular batches in MINOR slots
        if ("MINOR".equals(slotType)) {
            return false;
        }
        
        Integer yearLevel = batchYearMapping.getYearLevelFromBatchYear(batchYear);
        if (yearLevel == null) {
            return false;
        }
        
        List<TimeSlotDefinition> slots = getSlotsByYearLevel(yearLevel);
        if (slots == null) {
            return false;
        }
        
        for (TimeSlotDefinition slot : slots) {
            LocalTime slotStart = slot.getStartTimeAsLocalTime();
            LocalTime slotEnd = slot.getEndTimeAsLocalTime();
            if (slot.getSlotType().equalsIgnoreCase(slotType) &&
                startTime.equals(slotStart) &&
                endTime.equals(slotEnd)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if a time is during lunch hour for a specific batch year
     */
    public boolean isLunchHourForYear(int batchYear, LocalTime startTime) {
        if (batchYearMapping == null) {
            return false;
        }
        
        Integer yearLevel = batchYearMapping.getYearLevelFromBatchYear(batchYear);
        if (yearLevel == null) {
            return false;
        }
        
        TimeSlotConfiguration.LunchPeriod lunchPeriod = timeSlotConfiguration.getLunchPeriodForYearLevel(yearLevel);
        return lunchPeriod != null && lunchPeriod.isWithin(startTime);
    }
    
    /**
     * Check if a time slot is valid for minor courses
     */
    public boolean isMinorTimeSlotValid(LocalTime startTime, LocalTime endTime, String slotType) {
        if (timeSlotConfiguration == null) {
            return false;
        }
        
        List<TimeSlotDefinition> minorSlots = timeSlotConfiguration.getMinorSlots();
        if (minorSlots == null) {
            return false;
        }
        
        for (TimeSlotDefinition slot : minorSlots) {
            LocalTime slotStart = slot.getStartTimeAsLocalTime();
            LocalTime slotEnd = slot.getEndTimeAsLocalTime();
            if (startTime.equals(slotStart) &&
                endTime.equals(slotEnd) &&
                "MINOR".equalsIgnoreCase(slot.getSlotType())) {
                return true;
            }
        }
        
        return false;
    }
    
    private List<TimeSlotDefinition> getSlotsByYearLevel(int yearLevel) {
        if (timeSlotConfiguration == null) {
            return null;
        }
        switch (yearLevel) {
            case 1: return timeSlotConfiguration.getYear1Slots();
            case 2: return timeSlotConfiguration.getYear2Slots();
            case 3: return timeSlotConfiguration.getYear3Slots();
            case 4: return timeSlotConfiguration.getYear4Slots();
            default: return timeSlotConfiguration.getYear1Slots();
        }
    }

    public LocalTime getPreferredStartTime() {
        return timeSlotConfiguration != null ? timeSlotConfiguration.getPreferredStartTimeAsLocalTime() : null;
    }

    public int getTargetDailyLessonsPerBatch() {
        return timeSlotConfiguration != null ? timeSlotConfiguration.getTargetDailyLessonsPerBatch() : 4;
    }

    public int getAllowedDailyLessonsVariance() {
        return timeSlotConfiguration != null ? timeSlotConfiguration.getAllowedDailyLessonsVariance() : 1;
    }

    public int getMaxGapMinutes() {
        return timeSlotConfiguration != null ? timeSlotConfiguration.getMaxGapMinutes() : 60;
    }

    public int getMaxTeacherGapMinutes() {
        return timeSlotConfiguration != null ? timeSlotConfiguration.getMaxTeacherGapMinutes() : 90;
    }

    public int getConsecutiveLessonBufferMinutes() {
        return timeSlotConfiguration != null ? timeSlotConfiguration.getConsecutiveLessonBufferMinutes() : 5;
    }

    public int getMinimumBreakBetweenClassesMinutes() {
        return timeSlotConfiguration != null ? timeSlotConfiguration.getMinimumBreakBetweenClassesMinutes() : 15;
    }
}
