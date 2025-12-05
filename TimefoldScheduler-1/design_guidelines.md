# Design Guidelines: University Timetable Scheduling Engine

## Design Approach
**System Selected**: Hybrid approach drawing from Microsoft Outlook Calendar, Linear, and Notion
**Justification**: Productivity-focused application requiring information density, clear data visualization, and efficient workflows for schedule management

## Core Design Principles
1. **Data Clarity**: Prioritize readability of schedule information over decorative elements
2. **Workflow Efficiency**: Minimize clicks for common actions (edit, drag, add classes)
3. **Spatial Awareness**: Calendar grid is the hero - give it maximum screen real estate
4. **Progressive Disclosure**: Hide complexity until needed, reveal controls on hover/focus

## Typography System

**Font Family**: Inter (via Google Fonts CDN) for entire application
- Primary: Inter (400, 500, 600, 700)

**Type Scale**:
- Page Titles: text-2xl font-semibold (for main views like "Weekly Schedule")
- Section Headers: text-lg font-semibold (for sidebar sections, modal titles)
- Calendar Event Titles: text-sm font-medium (class names in calendar cells)
- Event Details: text-xs (teacher names, room info within cells)
- Body Text: text-sm (forms, descriptions)
- Labels: text-xs font-medium uppercase tracking-wide (form labels, filters)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, and 8
- Component padding: p-4 or p-6
- Section gaps: gap-4 or gap-6
- Calendar cell padding: p-2
- Modal/form spacing: space-y-4

**Grid Structure**:
```
Main Layout: Sidebar (280px fixed) + Main Content Area (flex-1)
- Sidebar: Navigation, filters, quick actions
- Main Area: Calendar grid takes 100% width
- No top navigation bar - integrate actions into sidebar
```

**Calendar Grid Layout**:
- Time slots as rows (30-minute or 1-hour increments)
- Days as columns (Monday-Friday typical view)
- Fixed header row for day labels
- Fixed left column for time labels
- Scrollable content area for schedule grid

## Component Library

### Navigation & Structure
**Sidebar** (280px fixed width):
- Logo/Institution name at top (p-6)
- View switcher (Daily/Weekly tabs)
- Date picker (compact calendar widget)
- Filter section (Departments, Teachers, Student Groups - collapsible)
- Quick actions: "Upload CSV", "Export Schedule", "New Class" buttons stacked vertically
- Settings/Help at bottom

### Calendar Components
**Calendar Grid Cell**:
- Minimum height: h-20 (80px) for readability
- Border: border border-gray-200
- Hover state: Subtle highlight to indicate interactivity
- Empty state: Dashed border to indicate droppable area

**Class Event Card** (within cells):
- Rounded corners: rounded-md
- Padding: p-2
- Shadow on hover: hover:shadow-md for drag affordance
- Stack layout: Course name (bold) → Teacher name → Student group (if applicable)
- Status indicator: Small dot or left border for conflicts (red), confirmed (green)
- Drag handle: Icon appears on hover (top-right corner)

**Time Slot Suggestions Panel**:
- Slides in from right side (400px width) when editing
- List of available slots with conflict-free indicators
- Each suggestion shows: Time, Available teachers, Student group availability
- Click to apply suggestion

### Forms & Modals
**Upload Modal**:
- Drag-and-drop zone (h-48, dashed border)
- File requirements text below
- Primary action: "Process & Schedule" button
- Secondary: "Cancel" link

**Edit Class Modal**:
- Form fields: Course dropdown, Teacher dropdown, Time slot picker, Student group multi-select
- Constraint violations shown inline with warning icons
- Smart suggestions panel embedded (scrollable section)
- Actions: "Save Changes", "Delete Class", "Cancel"

**Conflict Alert Banner**:
- Fixed top banner (when conflicts detected)
- Warning icon + count of conflicts
- "Review Conflicts" button to highlight affected cells

### Interactive Elements
**Buttons**:
- Primary: Solid background, px-4 py-2, rounded-md, font-medium
- Secondary: Border outline, same padding
- Icon buttons: p-2, rounded

**Drag & Drop Visual Feedback**:
- Dragging: Reduce opacity of source card, show ghost cursor
- Drop zones: Highlight with dashed border animation
- Invalid drop: Red border flash
- Valid drop: Green border confirmation

**Filter Pills**:
- Small tags (px-3 py-1, rounded-full, text-xs)
- Close icon on hover
- Stack horizontally with gap-2

## Responsive Behavior
- Desktop (lg:): Full sidebar + calendar grid
- Tablet (md:): Collapsible sidebar (hamburger menu), calendar grid adjusts
- Mobile: Stack to daily view only, full-width cards

## Animations
Use sparingly, only for:
- Modal fade-in/out (duration-200)
- Drag-and-drop transitions (smooth positioning)
- Sidebar collapse/expand (duration-300)
- Toast notifications (slide in from top-right)

## Data Visualization
**Conflict Indicators**:
- Red left border on conflicting class cards
- Warning icon badge overlay
- Tooltip on hover explaining conflict type

**Occupancy Indicators**:
- Teacher availability: Small avatar with status dot
- Room capacity: Progress bar if applicable
- Time slot density: Subtle background intensity

## Images
This application does not require hero images or marketing imagery. Focus on:
- Institution logo in sidebar (optional, small, p-4)
- Empty state illustrations (simple line art for "No classes scheduled")
- User avatars for teachers (small, 24px circles)

No large hero sections needed - this is a data-focused application dashboard.