package com.timetable.domain;

import java.io.Serializable;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class TimeSlotConfiguration implements Serializable {
    private List<TimeSlotDefinition> year1Slots;
    private List<TimeSlotDefinition> year2Slots;
    private List<TimeSlotDefinition> year3Slots;
    private List<TimeSlotDefinition> year4Slots;
    private List<TimeSlotDefinition> minorSlots;
    private BatchYearMapping batchYearMapping;
    private String preferredStartTime;
    private int maxGapMinutes;
    private int maxTeacherGapMinutes;
    private int consecutiveLessonBufferMinutes;
    private int minimumBreakBetweenClassesMinutes;
    private int targetDailyLessonsPerBatch;
    private int allowedDailyLessonsVariance;
    private LunchPeriod juniorLunchPeriod;
    private LunchPeriod seniorLunchPeriod;
    
    public TimeSlotConfiguration() {
        this.year1Slots = new ArrayList<>();
        this.year2Slots = new ArrayList<>();
        this.year3Slots = new ArrayList<>();
        this.year4Slots = new ArrayList<>();
        this.minorSlots = new ArrayList<>();
        this.batchYearMapping = new BatchYearMapping();
        this.preferredStartTime = "09:00";
        this.maxGapMinutes = 60;
        this.maxTeacherGapMinutes = 90;
        this.consecutiveLessonBufferMinutes = 5;
        this.minimumBreakBetweenClassesMinutes = 15;
        this.targetDailyLessonsPerBatch = 4;
        this.allowedDailyLessonsVariance = 1;
        this.juniorLunchPeriod = new LunchPeriod("13:14", "14:31");
        this.seniorLunchPeriod = new LunchPeriod("12:14", "13:16");
    }
    
    // Getters and Setters
    public List<TimeSlotDefinition> getYear1Slots() {
        return year1Slots;
    }
    
    public void setYear1Slots(List<TimeSlotDefinition> year1Slots) {
        this.year1Slots = year1Slots;
    }
    
    public List<TimeSlotDefinition> getYear2Slots() {
        return year2Slots;
    }
    
    public void setYear2Slots(List<TimeSlotDefinition> year2Slots) {
        this.year2Slots = year2Slots;
    }
    
    public List<TimeSlotDefinition> getYear3Slots() {
        return year3Slots;
    }
    
    public void setYear3Slots(List<TimeSlotDefinition> year3Slots) {
        this.year3Slots = year3Slots;
    }
    
    public List<TimeSlotDefinition> getYear4Slots() {
        return year4Slots;
    }
    
    public void setYear4Slots(List<TimeSlotDefinition> year4Slots) {
        this.year4Slots = year4Slots;
    }
    
    public List<TimeSlotDefinition> getMinorSlots() {
        return minorSlots;
    }
    
    public void setMinorSlots(List<TimeSlotDefinition> minorSlots) {
        this.minorSlots = minorSlots;
    }
    
    public BatchYearMapping getBatchYearMapping() {
        return batchYearMapping;
    }
    
    public void setBatchYearMapping(BatchYearMapping batchYearMapping) {
        this.batchYearMapping = batchYearMapping;
    }

    public String getPreferredStartTime() {
        return preferredStartTime;
    }

    public void setPreferredStartTime(String preferredStartTime) {
        this.preferredStartTime = preferredStartTime;
    }

    public LocalTime getPreferredStartTimeAsLocalTime() {
        return preferredStartTime != null ? LocalTime.parse(preferredStartTime) : null;
    }

    public int getMaxGapMinutes() {
        return maxGapMinutes;
    }

    public void setMaxGapMinutes(int maxGapMinutes) {
        this.maxGapMinutes = maxGapMinutes;
    }

    public int getMaxTeacherGapMinutes() {
        return maxTeacherGapMinutes;
    }

    public void setMaxTeacherGapMinutes(int maxTeacherGapMinutes) {
        this.maxTeacherGapMinutes = maxTeacherGapMinutes;
    }

    public int getConsecutiveLessonBufferMinutes() {
        return consecutiveLessonBufferMinutes;
    }

    public void setConsecutiveLessonBufferMinutes(int consecutiveLessonBufferMinutes) {
        this.consecutiveLessonBufferMinutes = consecutiveLessonBufferMinutes;
    }

    public int getMinimumBreakBetweenClassesMinutes() {
        return minimumBreakBetweenClassesMinutes;
    }

    public void setMinimumBreakBetweenClassesMinutes(int minimumBreakBetweenClassesMinutes) {
        this.minimumBreakBetweenClassesMinutes = minimumBreakBetweenClassesMinutes;
    }

    public int getTargetDailyLessonsPerBatch() {
        return targetDailyLessonsPerBatch;
    }

    public void setTargetDailyLessonsPerBatch(int targetDailyLessonsPerBatch) {
        this.targetDailyLessonsPerBatch = targetDailyLessonsPerBatch;
    }

    public int getAllowedDailyLessonsVariance() {
        return allowedDailyLessonsVariance;
    }

    public void setAllowedDailyLessonsVariance(int allowedDailyLessonsVariance) {
        this.allowedDailyLessonsVariance = allowedDailyLessonsVariance;
    }

    public LunchPeriod getJuniorLunchPeriod() {
        return juniorLunchPeriod;
    }

    public void setJuniorLunchPeriod(LunchPeriod juniorLunchPeriod) {
        this.juniorLunchPeriod = juniorLunchPeriod;
    }

    public LunchPeriod getSeniorLunchPeriod() {
        return seniorLunchPeriod;
    }

    public void setSeniorLunchPeriod(LunchPeriod seniorLunchPeriod) {
        this.seniorLunchPeriod = seniorLunchPeriod;
    }
    
    /**
     * Get time slots for a specific batch based on its year level mapping.
     * Uses the BatchYearMapping to determine which year's slots to use.
     * @param batchName The name of the batch (e.g., "CSE_A_2024")
     * @return The list of time slot definitions for that batch's year level
     */
    public List<TimeSlotDefinition> getSlotsByYear(String batchName) {
        Integer yearLevel = batchYearMapping.getYearLevel(batchName);
        
        switch (yearLevel) {
            case 1: return year1Slots;
            case 2: return year2Slots;
            case 3: return year3Slots;
            case 4: return year4Slots;
            default: return year1Slots;
        }
    }
    
    public LunchPeriod getLunchPeriodForYearLevel(int yearLevel) {
        return yearLevel <= 2 ? juniorLunchPeriod : seniorLunchPeriod;
    }

    @Override
    public String toString() {
        return "TimeSlotConfiguration{" +
                "year1Slots=" + year1Slots.size() +
                ", year2Slots=" + year2Slots.size() +
                ", year3Slots=" + year3Slots.size() +
                ", year4Slots=" + year4Slots.size() +
                ", minorSlots=" + minorSlots.size() +
                ", preferredStartTime='" + preferredStartTime + '\'' +
                ", maxGapMinutes=" + maxGapMinutes +
                ", maxTeacherGapMinutes=" + maxTeacherGapMinutes +
                ", consecutiveLessonBufferMinutes=" + consecutiveLessonBufferMinutes +
                ", minimumBreakBetweenClassesMinutes=" + minimumBreakBetweenClassesMinutes +
                ", targetDailyLessonsPerBatch=" + targetDailyLessonsPerBatch +
                ", allowedDailyLessonsVariance=" + allowedDailyLessonsVariance +
                '}';
    }

    public static class LunchPeriod implements Serializable {
        private String startTime;
        private String endTime;

        public LunchPeriod() {
        }

        public LunchPeriod(String startTime, String endTime) {
            this.startTime = startTime;
            this.endTime = endTime;
        }

        public String getStartTime() {
            return startTime;
        }

        public void setStartTime(String startTime) {
            this.startTime = startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public void setEndTime(String endTime) {
            this.endTime = endTime;
        }

        public LocalTime getStartTimeAsLocalTime() {
            return startTime != null ? LocalTime.parse(startTime) : null;
        }

        public LocalTime getEndTimeAsLocalTime() {
            return endTime != null ? LocalTime.parse(endTime) : null;
        }

        public boolean isWithin(LocalTime time) {
            LocalTime start = getStartTimeAsLocalTime();
            LocalTime end = getEndTimeAsLocalTime();
            if (start == null || end == null || time == null) {
                return false;
            }
            return time.isAfter(start) && time.isBefore(end);
        }
    }
}
