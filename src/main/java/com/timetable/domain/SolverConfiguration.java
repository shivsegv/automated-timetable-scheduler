package com.timetable.domain;

import java.io.Serializable;

public class SolverConfiguration implements Serializable {
    private int terminationMinutes = 5;
    private int terminationSeconds = 0;
    private Integer bestScoreLimit = null;
    private Integer unimprovedSecondsLimit = 120; // 2 minutes
    
    public SolverConfiguration() {
    }
    
    public SolverConfiguration(int terminationMinutes, int terminationSeconds, 
                              Integer bestScoreLimit, Integer unimprovedSecondsLimit) {
        this.terminationMinutes = terminationMinutes;
        this.terminationSeconds = terminationSeconds;
        this.bestScoreLimit = bestScoreLimit;
        this.unimprovedSecondsLimit = unimprovedSecondsLimit;
    }
    
    // Getters and Setters
    public int getTerminationMinutes() {
        return terminationMinutes;
    }
    
    public void setTerminationMinutes(int terminationMinutes) {
        this.terminationMinutes = terminationMinutes;
    }
    
    public int getTerminationSeconds() {
        return terminationSeconds;
    }
    
    public void setTerminationSeconds(int terminationSeconds) {
        this.terminationSeconds = terminationSeconds;
    }
    
    public Integer getBestScoreLimit() {
        return bestScoreLimit;
    }
    
    public void setBestScoreLimit(Integer bestScoreLimit) {
        this.bestScoreLimit = bestScoreLimit;
    }
    
    public Integer getUnimprovedSecondsLimit() {
        return unimprovedSecondsLimit;
    }
    
    public void setUnimprovedSecondsLimit(Integer unimprovedSecondsLimit) {
        this.unimprovedSecondsLimit = unimprovedSecondsLimit;
    }
    
    public long getTotalTerminationSeconds() {
        return (terminationMinutes * 60L) + terminationSeconds;
    }
    
    @Override
    public String toString() {
        return "SolverConfiguration{" +
                "terminationMinutes=" + terminationMinutes +
                ", terminationSeconds=" + terminationSeconds +
                ", bestScoreLimit=" + bestScoreLimit +
                ", unimprovedSecondsLimit=" + unimprovedSecondsLimit +
                '}';
    }
}
