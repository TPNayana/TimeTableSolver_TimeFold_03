import { Calendar, Upload, Download, Plus, Settings, HelpCircle, Users, BookOpen, GraduationCap } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface AppSidebarProps {
  onUploadClick: () => void;
  onNewClassClick: () => void;
  selectedDepartments?: string[];
  onDepartmentChange?: (depts: string[]) => void;
  allDepartments?: string[];
  selectedTeachers?: string[];
  onTeacherChange?: (teachers: string[]) => void;
  allTeachers?: string[];
  selectedGroups?: string[];
  onGroupChange?: (groups: string[]) => void;
  allGroups?: string[];
  onClearFilters?: () => void;
  viewMode?: "daily" | "weekly";
  onViewModeChange?: (mode: "daily" | "weekly") => void;
  selectedDay?: string;
  onSelectedDayChange?: (day: string) => void;
}

export function AppSidebar({
  onUploadClick,
  onNewClassClick,
  selectedDepartments = [],
  onDepartmentChange = () => {},
  allDepartments = [],
  selectedTeachers = [],
  onTeacherChange = () => {},
  allTeachers = [],
  selectedGroups = [],
  onGroupChange = () => {},
  allGroups = [],
  onClearFilters = () => {},
  viewMode = "weekly",
  onViewModeChange = () => {},
  selectedDay = "Monday",
  onSelectedDayChange = () => {},
}: AppSidebarProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  const toggleDepartment = (dept: string) => {
    onDepartmentChange(
      selectedDepartments.includes(dept)
        ? selectedDepartments.filter(d => d !== dept)
        : [...selectedDepartments, dept]
    );
  };

  const toggleTeacher = (teacher: string) => {
    onTeacherChange(
      selectedTeachers.includes(teacher)
        ? selectedTeachers.filter(t => t !== teacher)
        : [...selectedTeachers, teacher]
    );
  };

  const toggleGroup = (group: string) => {
    onGroupChange(
      selectedGroups.includes(group)
        ? selectedGroups.filter(g => g !== group)
        : [...selectedGroups, group]
    );
  };

  const handleExport = () => {
    window.location.href = '/api/export/schedule';
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold" data-testid="text-app-title">Timetable Scheduler</h1>
            </div>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>VIEW</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex gap-2 px-4">
              <Button
                size="sm"
                variant={viewMode === "daily" ? "default" : "outline"}
                className="flex-1"
                onClick={() => onViewModeChange("daily")}
                data-testid="button-view-daily"
              >
                Daily
              </Button>
              <Button
                size="sm"
                variant={viewMode === "weekly" ? "default" : "outline"}
                className="flex-1"
                onClick={() => onViewModeChange("weekly")}
                data-testid="button-view-weekly"
              >
                Weekly
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {viewMode === "daily" && (
          <SidebarGroup>
            <SidebarGroupLabel>SELECT DAY</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 space-y-2">
                {days.map((day) => (
                  <Button
                    key={day}
                    size="sm"
                    variant={selectedDay === day ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => onSelectedDayChange(day)}
                    data-testid={`button-day-${day.toLowerCase()}`}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Separator className="my-2" />

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between px-4 hover-elevate">
                FILTERS
                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? '' : '-rotate-90'}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="px-4 space-y-4">
                  {allDepartments.length > 0 && (
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 block">
                        Departments
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allDepartments.map((dept) => (
                          <Badge
                            key={dept}
                            variant={selectedDepartments.includes(dept) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleDepartment(dept)}
                            data-testid={`badge-department-${dept.toLowerCase()}`}
                          >
                            {dept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {allTeachers.length > 0 && (
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 block">
                        Teachers
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allTeachers.map((teacher) => (
                          <Badge
                            key={teacher}
                            variant={selectedTeachers.includes(teacher) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => toggleTeacher(teacher)}
                            data-testid={`badge-teacher-${teacher.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {teacher}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {allGroups.length > 0 && (
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 block">
                        Groups
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allGroups.map((group) => (
                          <Badge
                            key={group}
                            variant={selectedGroups.includes(group) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => toggleGroup(group)}
                            data-testid={`badge-group-${group.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedDepartments.length > 0 || selectedTeachers.length > 0 || selectedGroups.length > 0) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={onClearFilters}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>QUICK ACTIONS</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={onUploadClick}
                data-testid="button-upload-csv"
              >
                <Upload className="h-4 w-4" />
                Upload CSV
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="h-4 w-4" />
                Export Schedule
              </Button>
              <Button 
                variant="default" 
                className="w-full justify-start gap-2"
                onClick={onNewClassClick}
                data-testid="button-new-class"
              >
                <Plus className="h-4 w-4" />
                New Class
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="button-settings">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="button-help">
              <HelpCircle className="h-4 w-4" />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
