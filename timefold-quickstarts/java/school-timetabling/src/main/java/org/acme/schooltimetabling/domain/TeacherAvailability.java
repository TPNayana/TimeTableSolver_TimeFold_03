package org.acme.schooltimetabling.domain;

public class TeacherAvailability {
    // Empty class - just to satisfy your Timetable class
    private String id;
    private String teacher;
    
    public TeacherAvailability() {}
    
    public TeacherAvailability(String id, String teacher) {
        this.id = id;
        this.teacher = teacher;
    }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTeacher() { return teacher; }
    public void setTeacher(String teacher) { this.teacher = teacher; }
}