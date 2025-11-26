package com.timetable.domain;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuration for mapping batch identifiers to year levels.
 * Allows users to configure which batches correspond to Year 1, Year 2, Year 3, and Year 4.
 * This is essential as batches graduate and new batches arrive each year.
 */
public class BatchYearMapping implements Serializable {
    // Map of year identifier (e.g., "2024") to year level (1, 2, 3, or 4)
    private Map<String, Integer> yearIdentifierToLevel;
    
    public BatchYearMapping() {
        this.yearIdentifierToLevel = new HashMap<>();
    }
    
    public Map<String, Integer> getYearIdentifierToLevel() {
        return yearIdentifierToLevel;
    }
    
    public void setYearIdentifierToLevel(Map<String, Integer> yearIdentifierToLevel) {
        this.yearIdentifierToLevel = yearIdentifierToLevel;
    }
    
    /**
     * Add or update a mapping from a year identifier to a year level.
     * @param yearIdentifier The identifier (e.g., "2024" for batches from 2024)
     * @param yearLevel The year level (1, 2, 3, or 4)
     */
    public void addMapping(String yearIdentifier, Integer yearLevel) {
        if (yearLevel < 1 || yearLevel > 4) {
            throw new IllegalArgumentException("Year level must be between 1 and 4");
        }
        yearIdentifierToLevel.put(yearIdentifier, yearLevel);
    }
    
    /**
     * Remove a mapping for a specific year identifier.
     * @param yearIdentifier The identifier to remove
     */
    public void removeMapping(String yearIdentifier) {
        yearIdentifierToLevel.remove(yearIdentifier);
    }
    
    /**
     * Get the year level for a given batch name.
     * Searches for year identifiers within the batch name.
     * @param batchName The name of the batch (e.g., "CSE_A_2024")
     * @return The year level (1-4), or 1 as default if no mapping found
     */
    public Integer getYearLevel(String batchName) {
        if (batchName == null) {
            return 1;
        }
        
        String lowerName = batchName.toLowerCase();
        
        // Check each mapped year identifier
        for (Map.Entry<String, Integer> entry : yearIdentifierToLevel.entrySet()) {
            if (lowerName.contains(entry.getKey().toLowerCase())) {
                return entry.getValue();
            }
        }
        
        // Default to year 1 if no mapping found
        return 1;
    }
    
    /**
     * Get the year level for a given batch year (numeric).
     * @param batchYear The year the batch started (e.g., 2024)
     * @return The year level (1-4), or null if no mapping found
     */
    public Integer getYearLevelFromBatchYear(int batchYear) {
        String yearStr = String.valueOf(batchYear);
        return yearIdentifierToLevel.get(yearStr);
    }
    
    /**
     * Clear all mappings.
     */
    public void clear() {
        yearIdentifierToLevel.clear();
    }
    
    @Override
    public String toString() {
        return "BatchYearMapping{" +
                "mappings=" + yearIdentifierToLevel +
                '}';
    }
}
