package org.acme.schooltimetabling.domain;

import java.time.DayOfWeek;
import java.time.LocalTime;

import ai.timefold.solver.core.api.domain.lookup.PlanningId;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

@JsonIdentityInfo(scope = TeacherAvailability.class, generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class TeacherAvailability {

    @PlanningId
    private String id;

    private String teacher;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;

    public TeacherAvailability() {
    }

    public TeacherAvailability(String id, String teacher, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
        this.id = id;
        this.teacher = teacher;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public String getId() {
        return id;
    }

    public String getTeacher() {
        return teacher;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }
}