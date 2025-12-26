package org.acme.schooltimetabling.domain;

public class Room {
    private String id;
    private String name;
    
    public Room() {}
    
    public Room(String id, String name) {
        this.id = id;
        this.name = name;
    }
    
    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}