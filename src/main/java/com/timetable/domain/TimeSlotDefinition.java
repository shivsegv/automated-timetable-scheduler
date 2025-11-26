package com.timetable.domain;

import java.io.Serializable;
import java.time.LocalTime;

public class TimeSlotDefinition implements Serializable {
    private String startTime; // Format: "HH:mm"
    private String endTime;   // Format: "HH:mm"
    private String slotType;  // LECTURE, LAB, MINOR
    
    public TimeSlotDefinition() {
    }
    
    public TimeSlotDefinition(String startTime, String endTime, String slotType) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.slotType = slotType;
    }
    
    public TimeSlotDefinition(LocalTime startTime, LocalTime endTime, String slotType) {
        this.startTime = startTime.toString();
        this.endTime = endTime.toString();
        this.slotType = slotType;
    }
    
    // Getters and Setters
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
    
    public String getSlotType() {
        return slotType;
    }
    
    public void setSlotType(String slotType) {
        this.slotType = slotType;
    }
    
    public LocalTime getStartTimeAsLocalTime() {
        return LocalTime.parse(startTime);
    }
    
    public LocalTime getEndTimeAsLocalTime() {
        return LocalTime.parse(endTime);
    }
    
    @Override
    public String toString() {
        return "TimeSlotDefinition{" +
                "startTime='" + startTime + '\'' +
                ", endTime='" + endTime + '\'' +
                ", slotType='" + slotType + '\'' +
                '}';
    }
}
