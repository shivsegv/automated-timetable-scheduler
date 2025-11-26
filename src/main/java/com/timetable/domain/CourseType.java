package com.timetable.domain;

public enum CourseType {
    REGULAR("regular"),
    ELECTIVE("elective"),
    LAB("lab"),
    MINOR("minor");

    private final String value;

    CourseType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}
