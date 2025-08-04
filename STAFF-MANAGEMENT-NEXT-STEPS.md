# 🚀 STAFF MANAGEMENT - DETAILED NEXT STEPS

## 📍 CURRENT STATUS
✅ **COMPLETED:**
- Staff Management basic CRUD operations
- Staff table view with search/filter
- Add/Edit staff forms with validation
- Staff overview cards with metrics
- Smooth scrolling to edit forms
- Cursor pointer styling on all clickable elements
- Controlled form inputs that update properly between different staff members

## 🎯 IMMEDIATE NEXT STEP: STAFF SCHEDULING SYSTEM

### **STEP 1: DATABASE SCHEMA SETUP** ⏰
**Time Estimate: 30 minutes**

**Create this SQL file: `staff-scheduling-schema.sql`**
```sql
-- Staff Scheduling System Database Schema

-- 1. Create staff_schedules table
CREATE TABLE IF NOT EXISTS staff_schedules (
    id BIGSERIAL PRIMARY KEY,
    staff_member_id BIGINT NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    position VARCHAR(100), -- Specific position for this shift
    location VARCHAR(100) DEFAULT 'Main Floor', -- Area assignment
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
    notes TEXT,
    created_by BIGINT REFERENCES staff_members(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_member ON staff_schedules(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON staff_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_status ON staff_schedules(status);

-- 3. Create schedule templates table for recurring schedules
CREATE TABLE IF NOT EXISTS schedule_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    staff_member_id BIGINT REFERENCES staff_members(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    position VARCHAR(100),
    location VARCHAR(100) DEFAULT 'Main Floor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Insert sample data for testing
INSERT INTO staff_schedules (staff_member_id, schedule_date, start_time, end_time, position, status) 
SELECT 
    sm.id,
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00',
    '17:00:00',
    'Server',
    'scheduled'
FROM staff_members sm 
WHERE sm.role = 'server' 
LIMIT 3;

INSERT INTO staff_schedules (staff_member_id, schedule_date, start_time, end_time, position, status) 
SELECT 
    sm.id,
    CURRENT_DATE + INTERVAL '2 days',
    '12:00:00',
    '20:00:00',
    'Cook',
    'scheduled'
FROM staff_members sm 
WHERE sm.role = 'cook' 
LIMIT 2;
```

**Action Items:**
1. Create the file `staff-scheduling-schema.sql` in root directory
2. Run this SQL in Supabase SQL Editor
3. Verify tables are created and sample data exists

---

### **STEP 2: UPDATE ADMIN DASHBOARD - ADD SCHEDULING TAB** 🖥️
**Time Estimate: 45 minutes**

**File to modify: `src/app/admin/dashboard/page.tsx`**

**2A. Update activeSection type (Line ~376):**
```typescript
// FIND this line:
const [activeSection, setActiveSection] = useState<"dashboard" | "dataentry" | "inventory" | "reservations" | "database" | "staff" | "settings">("dashboard");

// REPLACE with:
const [activeSection, setActiveSection] = useState<"dashboard" | "dataentry" | "inventory" | "reservations" | "database" | "staff" | "scheduling" | "settings">("dashboard");
```

**2B. Add scheduling state variables (after line ~383):**
```typescript
// Add these new state variables after the existing staff state
const [schedules, setSchedules] = useState<any[]>([]);
const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
const [editingScheduleData, setEditingScheduleData] = useState<any>(null);
const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list');
const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
  const today = new Date();
  return today.getFullYear() + '-' + 
         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
         String(today.getDate()).padStart(2, '0');
});
const [loadingSchedules, setLoadingSchedules] = useState(false);
```

**2C. Add scheduling navigation button (find the staff navigation button around line ~2040):**
```typescript
// ADD this button AFTER the staff button:
<button 
  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 group ${
    activeSection === "scheduling" 
      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105" 
      : "hover:bg-gray-800/50 text-gray-200 hover:text-white hover:scale-102"
  }`} 
  onClick={() => setActiveSection("scheduling")}
> 
  <div className={`p-1 rounded-lg ${
    activeSection === "scheduling" 
      ? "bg-white/20" 
      : "bg-purple-600/20 group-hover:bg-purple-600/30"
  }`}>
    <ClockIcon className="h-5 w-5" />
  </div>
  <span>Scheduling</span>
  {activeSection === "scheduling" && <div className="w-2 h-2 bg-white rounded-full ml-auto"></div>}
</button>
```

---

### **STEP 3: CREATE SCHEDULING FUNCTIONS** ⚙️
**Time Estimate: 1 hour**

**Add these functions after the existing staff functions (around line ~1480):**

```typescript
// SCHEDULING MANAGEMENT FUNCTIONS
const fetchSchedules = async () => {
  setLoadingSchedules(true);
  try {
    const { data, error } = await supabase
      .from('staff_schedules')
      .select(`
        *,
        staff_members (
          id,
          first_name,
          last_name,
          employee_id,
          role
        )
      `)
      .order('schedule_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    setSchedules(data || []);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    toast.error('Failed to load schedules');
  } finally {
    setLoadingSchedules(false);
  }
};

const handleAddSchedule = async (e: React.FormEvent) => {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);
  
  try {
    const scheduleData = {
      staff_member_id: formData.get('staff_member_id') as string,
      schedule_date: formData.get('schedule_date') as string,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      break_start: formData.get('break_start') as string || null,
      break_end: formData.get('break_end') as string || null,
      position: formData.get('position') as string,
      location: formData.get('location') as string || 'Main Floor',
      notes: formData.get('notes') as string || null,
      status: 'scheduled',
      created_by: profile?.id
    };

    const { data, error } = await supabase
      .from('staff_schedules')
      .insert([scheduleData])
      .select(`
        *,
        staff_members (
          id,
          first_name,
          last_name,
          employee_id,
          role
        )
      `)
      .single();

    if (error) throw error;

    setSchedules([...schedules, data]);
    setShowAddScheduleForm(false);
    toast.success('Schedule added successfully');
    
    // Reset form
    (e.target as HTMLFormElement).reset();
  } catch (error) {
    console.error('Error adding schedule:', error);
    toast.error('Failed to add schedule');
  }
};

const handleEditSchedule = (schedule: any) => {
  setEditingSchedule(schedule.id);
  setEditingScheduleData(schedule);
  
  // Smooth scroll to edit form
  setTimeout(() => {
    const editForm = document.getElementById('schedule-edit-form');
    if (editForm) {
      editForm.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  }, 100);
};

const handleUpdateSchedule = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const updatedData = {
      staff_member_id: editingScheduleData.staff_member_id,
      schedule_date: editingScheduleData.schedule_date,
      start_time: editingScheduleData.start_time,
      end_time: editingScheduleData.end_time,
      break_start: editingScheduleData.break_start || null,
      break_end: editingScheduleData.break_end || null,
      position: editingScheduleData.position,
      location: editingScheduleData.location,
      notes: editingScheduleData.notes,
      status: editingScheduleData.status
    };

    const { error } = await supabase
      .from('staff_schedules')
      .update(updatedData)
      .eq('id', editingSchedule);

    if (error) throw error;

    setSchedules(schedules.map(schedule => 
      schedule.id === editingSchedule 
        ? { ...schedule, ...updatedData }
        : schedule
    ));

    setEditingSchedule(null);
    setEditingScheduleData(null);
    toast.success('Schedule updated successfully');
  } catch (error) {
    console.error('Error updating schedule:', error);
    toast.error('Failed to update schedule');
  }
};

const handleDeleteSchedule = async (scheduleId: string) => {
  if (!confirm('Are you sure you want to delete this schedule?')) return;
  
  try {
    const { error } = await supabase
      .from('staff_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;

    setSchedules(schedules.filter(s => s.id !== scheduleId));
    toast.success('Schedule deleted successfully');
  } catch (error) {
    console.error('Error deleting schedule:', error);
    toast.error('Failed to delete schedule');
  }
};

const handleScheduleDataChange = (field: string, value: string) => {
  setEditingScheduleData((prev: any) => ({
    ...prev,
    [field]: value
  }));
};

const handleCancelScheduleEdit = () => {
  setEditingSchedule(null);
  setEditingScheduleData(null);
};
```

---

### **STEP 4: ADD SCHEDULING SECTION TO UI** 🎨
**Time Estimate: 2 hours**

**Add this section AFTER the staff section ends (around line ~4300):**

```typescript
{/* Scheduling Section */}
{activeSection === "scheduling" && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-white">Staff Scheduling</h2>
      <div className="flex gap-3">
        <Button
          onClick={() => setScheduleView(scheduleView === 'list' ? 'calendar' : 'list')}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800 cursor-pointer"
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          {scheduleView === 'list' ? 'Calendar View' : 'List View'}
        </Button>
        <Button 
          onClick={() => setShowAddScheduleForm(!showAddScheduleForm)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer"
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>
    </div>

    {/* Schedule Overview Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-[#23232a] border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Today's Shifts</p>
              <p className="text-2xl font-bold text-white">
                {schedules.filter(s => s.schedule_date === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-[#23232a] border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Week</p>
              <p className="text-2xl font-bold text-white">
                {schedules.filter(s => {
                  const scheduleDate = new Date(s.schedule_date);
                  const today = new Date();
                  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  return scheduleDate >= weekStart && scheduleDate <= weekEnd;
                }).length}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-[#23232a] border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">
                {schedules.filter(s => s.status === 'scheduled').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-[#23232a] border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Confirmed</p>
              <p className="text-2xl font-bold text-white">
                {schedules.filter(s => s.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Add Schedule Form */}
    {showAddScheduleForm && (
      <Card className="bg-[#23232a] border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Add New Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Staff Member</label>
              <select
                name="staff_member_id"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select Staff Member</option>
                {staffMembers.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name} - {staff.role}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Date</label>
              <input
                type="date"
                name="schedule_date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Start Time</label>
              <input
                type="time"
                name="start_time"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">End Time</label>
              <input
                type="time"
                name="end_time"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Break Start</label>
              <input
                type="time"
                name="break_start"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Break End</label>
              <input
                type="time"
                name="break_end"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Position</label>
              <input
                type="text"
                name="position"
                placeholder="Server, Cook, Host, etc."
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Location</label>
              <select
                name="location"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Main Floor">Main Floor</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Bar">Bar</option>
                <option value="Patio">Patio</option>
                <option value="Private Dining">Private Dining</option>
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-white text-sm font-medium mb-2 block">Notes</label>
              <textarea
                name="notes"
                placeholder="Special instructions or notes for this shift..."
                rows={2}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={loadingSchedules}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer"
              >
                {loadingSchedules ? 'Adding...' : 'Add Schedule'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowAddScheduleForm(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )}

    {/* Schedule List */}
    <Card className="bg-[#23232a] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Schedules ({schedules.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left text-gray-300 font-medium py-3 px-4">Staff Member</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Date</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Time</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Position</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Location</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Status</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-gray-600 hover:bg-[#2a2a31] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full p-2 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {schedule.staff_members?.first_name?.charAt(0)}{schedule.staff_members?.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {schedule.staff_members?.first_name} {schedule.staff_members?.last_name}
                        </p>
                        <p className="text-gray-400 text-sm">{schedule.staff_members?.employee_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white">
                      {new Date(schedule.schedule_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white">
                      <div>{schedule.start_time} - {schedule.end_time}</div>
                      {schedule.break_start && schedule.break_end && (
                        <div className="text-gray-400 text-sm">
                          Break: {schedule.break_start} - {schedule.break_end}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-sm font-medium">
                      {schedule.position}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-300">{schedule.location}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      schedule.status === 'confirmed' 
                        ? 'bg-green-600/20 text-green-400' 
                        : schedule.status === 'scheduled'
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : schedule.status === 'cancelled'
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSchedule(schedule)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 cursor-pointer"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="border-red-600 text-red-400 hover:bg-red-800 cursor-pointer"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {schedules.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Schedules Found</h3>
              <p className="text-gray-400">
                Add your first schedule to get started.
              </p>
            </div>
          )}
        </div>

        {/* Edit Schedule Form */}
        {editingSchedule && editingScheduleData && (
          <div id="schedule-edit-form" className="mt-8 border-t border-gray-600 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Schedule</h3>
            <form onSubmit={handleUpdateSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Staff Member</label>
                <select 
                  name="staff_member_id"
                  value={editingScheduleData.staff_member_id || ''}
                  onChange={(e) => handleScheduleDataChange('staff_member_id', e.target.value)}
                  className="w-full bg-[#2a2a31] border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                >
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name} - {staff.role}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input 
                  type="date"
                  value={editingScheduleData.schedule_date || ''}
                  onChange={(e) => handleScheduleDataChange('schedule_date', e.target.value)}
                  className="w-full bg-[#2a2a31] border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                <input 
                  type="time"
                  value={editingScheduleData.start_time || ''}
                  onChange={(e) => handleScheduleDataChange('start_time', e.target.value)}
                  className="w-full bg-[#2a2a31] border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                <input 
                  type="time"
                  value={editingScheduleData.end_time || ''}
                  onChange={(e) => handleScheduleDataChange('end_time', e.target.value)}
                  className="w-full bg-[#2a2a31] border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                <input 
                  type="text"
                  value={editingScheduleData.position || ''}
                  onChange={(e) => handleScheduleDataChange('position', e.target.value)}
                  className="w-full bg-[#2a2a31] border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select 
                  value={editingScheduleData.status || ''}
                  onChange={(e) => handleScheduleDataChange('status', e.target.value)}
                  className="w-full bg-[#2a2a31] border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              <div className="md:col-span-2 flex gap-3 pt-4">
                <Button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  Save Changes
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleCancelScheduleEdit}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}
```

---

### **STEP 5: UPDATE useEffect TO LOAD SCHEDULES** 🔄
**Time Estimate: 10 minutes**

**Find the useEffect around line ~1600 and update it:**

```typescript
// FIND this useEffect:
useEffect(() => {
  if (!loading && profile?.role === "admin") {
    console.log("Admin authenticated, fetching initial data");
    supabase.rpc("get_reservations_per_day").then(({ data }) => {
      setAnalytics(data);
      setAnalyticsLoading(false);
    });
    // Force fresh reservation data on mount
    fetchReservations();
    // Load staff members
    fetchStaffMembers();
    // Load saved metrics list
    loadSavedMetricsList();
    // Load metrics for today
    loadMetricsForDate(selectedDate);
    // Calculate auto-metrics for today
    calculateAutoMetrics(selectedDate);
  }
  if (!loading && (!profile || profile.role !== "admin")) {
    router.replace("/");
  }
}, [profile, loading, router]);

// REPLACE with (ADD fetchSchedules() call):
useEffect(() => {
  if (!loading && profile?.role === "admin") {
    console.log("Admin authenticated, fetching initial data");
    supabase.rpc("get_reservations_per_day").then(({ data }) => {
      setAnalytics(data);
      setAnalyticsLoading(false);
    });
    // Force fresh reservation data on mount
    fetchReservations();
    // Load staff members
    fetchStaffMembers();
    // Load schedules
    fetchSchedules();
    // Load saved metrics list
    loadSavedMetricsList();
    // Load metrics for today
    loadMetricsForDate(selectedDate);
    // Calculate auto-metrics for today
    calculateAutoMetrics(selectedDate);
  }
  if (!loading && (!profile || profile.role !== "admin")) {
    router.replace("/");
  }
}, [profile, loading, router]);
```

---

## 🎯 TESTING CHECKLIST

**After implementing all steps, test these features:**

1. ✅ **Navigation:** Can click "Scheduling" tab and it loads
2. ✅ **Add Schedule:** Form works and creates new schedules
3. ✅ **View Schedules:** Table displays all schedules with staff info
4. ✅ **Edit Schedule:** Can click edit, form populates, saves changes
5. ✅ **Delete Schedule:** Can delete schedules with confirmation
6. ✅ **Overview Cards:** Cards show correct counts
7. ✅ **Smooth Scrolling:** Edit form scrolls into view
8. ✅ **Error Handling:** Proper error messages on failures

---

## 🚨 POTENTIAL ISSUES TO WATCH FOR

1. **ClockIcon Import:** Make sure ClockIcon is imported from heroicons
2. **Staff Members Loading:** Ensure staffMembers are loaded before scheduling
3. **Date Formatting:** Watch for timezone issues with dates
4. **Foreign Key Constraints:** Verify staff_member_id exists when creating schedules
5. **Permission Errors:** Make sure Supabase RLS allows admin to read/write schedules

---

## 📁 FILES THAT WILL BE MODIFIED

1. **NEW:** `staff-scheduling-schema.sql` (create this first)
2. **MODIFY:** `src/app/admin/dashboard/page.tsx` (main changes)
3. **VERIFY:** Supabase database (run SQL schema)

---

## ⏱️ TOTAL TIME ESTIMATE: 4-5 hours

**Breakdown:**
- Database Setup: 30 minutes
- Dashboard Updates: 45 minutes  
- Functions: 1 hour
- UI Implementation: 2 hours
- Testing & Debugging: 1-1.5 hours

---

## 🎉 SUCCESS CRITERIA

**When this step is complete, you should have:**
✅ A fully functional scheduling system
✅ Add/edit/delete schedules
✅ Staff member scheduling with times and positions
✅ Schedule status management
✅ Overview metrics
✅ Smooth user experience matching existing patterns

**NEXT STEP AFTER THIS:** Time Clock System (separate implementation)
