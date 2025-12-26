package org.acme.schooltimetabling.domain;

import ai.timefold.solver.core.api.domain.solution.PlanningEntityCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.PlanningScore;
import ai.timefold.solver.core.api.domain.solution.PlanningSolution;
import ai.timefold.solver.core.api.domain.solution.ProblemFactCollectionProperty;
import ai.timefold.solver.core.api.domain.valuerange.ValueRangeProvider;
import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@PlanningSolution
public class Timetable {

    private String name;
    private List<Timeslot> timeslots;
    private List<Room> rooms;
    private List<TeacherAvailability> teacherAvailabilities;
    private List<Lesson> lessons;

    @PlanningScore
    private HardSoftScore score;

    @JsonIgnore
    private SolverStatus solverStatus;

    // No-arg constructor required for Jackson
    public Timetable() {
    }

    public Timetable(String name, List<Timeslot> timeslots, List<Room> rooms,
                     List<TeacherAvailability> teacherAvailabilities, List<Lesson> lessons) {
        this.name = name;
        this.timeslots = timeslots;
        this.rooms = rooms;
        this.teacherAvailabilities = teacherAvailabilities;
        this.lessons = lessons;
    }

    public Timetable(String name, HardSoftScore score, SolverStatus solverStatus) {
        this.name = name;
        this.score = score;
        this.solverStatus = solverStatus;
    }

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @ValueRangeProvider
    @ProblemFactCollectionProperty
    public List<Timeslot> getTimeslots() {
        return timeslots;
    }

    public void setTimeslots(List<Timeslot> timeslots) {
        this.timeslots = timeslots;
    }

    @ValueRangeProvider
    @ProblemFactCollectionProperty
    public List<Room> getRooms() {
        return rooms;
    }

    public void setRooms(List<Room> rooms) {
        this.rooms = rooms;
    }

    @ProblemFactCollectionProperty
    public List<TeacherAvailability> getTeacherAvailabilities() {
        return teacherAvailabilities;
    }

    public void setTeacherAvailabilities(List<TeacherAvailability> teacherAvailabilities) {
        this.teacherAvailabilities = teacherAvailabilities;
    }

    @PlanningEntityCollectionProperty
    public List<Lesson> getLessons() {
        return lessons;
    }

    public void setLessons(List<Lesson> lessons) {
        this.lessons = lessons;
    }

    public HardSoftScore getScore() {
        return score;
    }

    public void setScore(HardSoftScore score) {
        this.score = score;
    }

    public SolverStatus getSolverStatus() {
        return solverStatus;
    }

    public void setSolverStatus(SolverStatus solverStatus) {
        this.solverStatus = solverStatus;
    }
}