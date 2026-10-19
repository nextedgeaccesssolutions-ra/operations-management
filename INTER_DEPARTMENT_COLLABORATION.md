# 🤝 Inter-Department Collaboration System

## Overview

The NEAS Virtual Office now features a **live inter-department collaboration system** where all 8 departments communicate and collaborate with each other in real-time. This creates a dynamic, interactive virtual office environment where departments don't work in silos but actively coordinate and support each other.

---

## 🎯 What's New

### ✅ Live Inter-Department Communication

**Every 8-20 seconds**, departments automatically:
- Send messages to other departments
- Request information or approvals
- Share updates and progress reports
- Alert about urgent matters
- Initiate collaboration sessions

### ✅ Real-Time Message Feed

Watch as departments communicate live:
- **📤 Requests** - Departments asking for input or data
- **📥 Responses** - Departments providing information
- **📊 Updates** - Progress reports and status updates
- **⚠️ Alerts** - Urgent matters requiring attention
- **🤝 Collaboration** - Requests to work together

### ✅ Collaboration Sessions

When departments need to work together on complex tasks, they automatically start **collaboration sessions**:
- Multiple departments join forces
- Shared objectives defined
- Real-time coordination
- Progress tracking

### ✅ Department Filtering

Filter the communication feed by specific department:
- View all messages across all departments
- Focus on specific department communications
- See who's talking to whom
- Track cross-department workflows

---

## 🏢 Departments That Collaborate

All 8 departments actively communicate:

| Department | Icon | Collaboration Focus |
|------------|------|---------------------|
| **Executive** | 👔 | Strategic planning, approvals, coordination |
| **Operations** | ⚙️ | Process coordination, resource allocation |
| **Finance** | 💰 | Budget approvals, financial data sharing |
| **Sales** | 📈 | Customer data, revenue forecasts |
| **Procurement** | 🔗 | Supplier coordination, purchase approvals |
| **Safety & Quality** | 🛡️ | Compliance checks, safety protocols |
| **People** | 🤝 | HR coordination, team planning |
| **Customer** | 🎧 | Customer issues, support coordination |

---

## 💬 Message Types

### 📤 Request Messages
Departments ask for information, approvals, or data:
```
📤 Mara Vance (Executive) → Finance
"Need budget approval for Q4 initiative"
```

### 📥 Response Messages
Departments provide requested information:
```
📥 Yuna Haruki (Finance) → Executive
"Budget approved. Here's the allocation breakdown..."
```

### 📊 Update Messages
Departments share progress and status:
```
📊 Dele Okafor (Operations) → All Departments
"Update: Q4 planning is now 75% complete"
```

### ⚠️ Alert Messages
Urgent matters requiring immediate attention:
```
⚠️ Clara Fonte (Safety) → Operations
"URGENT: Safety inspection required before proceeding"
```

### 🤝 Collaboration Messages
Requests to work together on shared goals:
```
🤝 Marcus Chen (People) → Finance
"Let's collaborate on the annual salary benchmarking"
```

---

## 🔄 How It Works

### 1. Autonomous Communication Engine

The `InterDepartmentEngine` simulates realistic department interactions:

```typescript
class InterDepartmentEngine {
  // Every 8-20 seconds
  - Pick two random agents from different departments
  - Generate contextual message based on their tasks
  - Create collaboration session if needed
  - Update real-time feed
}
```

### 2. Message Generation

Messages are contextually generated based on:
- Agent's current tasks
- Department responsibilities
- Cross-department dependencies
- Priority levels (urgent, normal, low)

### 3. Collaboration Sessions

When departments need to work together:
- System detects need for collaboration
- Creates session with shared objective
- Tracks participating departments and agents
- Monitors session status (active, completed, paused)

---

## 🎨 User Interface

### Navigation

New sidebar item: **🤝 Dept. Collaboration**

### Main View

The Inter-Department Collaboration view shows:

1. **Header**
   - Live indicator (green pulsing dot)
   - View mode toggle (Messages / Collaborations)
   - Department filter buttons

2. **Messages Tab**
   - Real-time message feed
   - Color-coded by priority (urgent = red, normal = blue, low = gray)
   - Department badges with colors
   - Timestamps
   - Related task information

3. **Collaborations Tab**
   - Active collaboration sessions
   - Participating departments
   - Involved agents
   - Session objectives
   - Start time

4. **Footer Stats**
   - Total messages count
   - Active collaborations count
   - Total departments count

---

## 📊 Example Interactions

### Example 1: Budget Approval Flow

```
📤 Mara Vance (Executive) → Finance
"Need budget approval for Q4 capacity review initiative"
Priority: URGENT

📥 Yuna Haruki (Finance) → Executive
"Budget approved. Allocation: $50,000 for Q4 initiatives"
Priority: NORMAL

📊 Mara Vance (Executive) → All Departments
"Update: Q4 budget approved, proceeding with planning"
Priority: NORMAL
```

### Example 2: Safety Coordination

```
⚠️ Clara Fonte (Safety) → Operations
"URGENT: Safety inspection required before rope access work"
Priority: URGENT

📥 Dele Okafor (Operations) → Safety
"Acknowledged. Scheduling inspection for tomorrow 9 AM"
Priority: NORMAL

📊 Clara Fonte (Safety) → Operations
"Update: Inspection completed. All clear to proceed"
Priority: NORMAL
```

### Example 3: Cross-Department Collaboration

```
🤝 Marcus Chen (People) → Finance
"Let's collaborate on annual salary benchmarking"
Priority: NORMAL

🤝 Collaboration Session Started
Title: "People × Finance Collaboration"
Objective: "Coordinate Q4 salary benchmarking"
Departments: People, Finance
Agents: Marcus Chen, Yuna Haruki
Status: Active
```

---

## 🎯 Key Features

### ✅ Real-Time Updates
- Messages appear instantly as they're generated
- No page refresh needed
- Smooth animations and transitions

### ✅ Priority Indicators
- 🔴 **Urgent** - Red border and badge
- 🔵 **Normal** - Blue border
- ⚪ **Low** - Gray border

### ✅ Department Color Coding
Each department has a unique color:
- Executive: Purple (#8b5cf6)
- Operations: Blue (#3b82f6)
- Finance: Green (#10b981)
- Sales: Amber (#f59e0b)
- Procurement: Cyan (#06b6d4)
- Safety: Red (#ef4444)
- People: Pink (#ec4899)
- Customer: Orange (#f97316)

### ✅ Message Filtering
- View all messages
- Filter by specific department
- See incoming/outgoing messages
- Track cross-department workflows

### ✅ Collaboration Tracking
- Active collaboration sessions
- Participating departments
- Session objectives
- Real-time status updates

---

## 🔧 Technical Details

### InterDepartmentEngine

Located in `src/interDepartmentEngine.ts`:

```typescript
class InterDepartmentEngine {
  private messages: DepartmentMessage[] = [];
  private collaborations: CollaborationSession[] = [];
  private intervalId: number | null = null;
  private listeners: Set<() => void> = new Set();

  // Start communication (every 8-20 seconds)
  startCommunication() {
    this.intervalId = setInterval(() => {
      this.simulateDepartmentInteraction();
    }, Math.random() * 12000 + 8000);
  }

  // Generate contextual messages
  generateDepartmentMessage(fromAgent, toAgent) {
    // Based on tasks, departments, priorities
  }

  // Start collaboration sessions
  startCollaboration(agent1, agent2) {
    // Create shared objective
  }
}
```

### InterDepartmentFeed Component

Located in `src/components/InterDepartmentFeed.tsx`:

```typescript
export default function InterDepartmentFeed() {
  const [messages, setMessages] = useState<DepartmentMessage[]>([]);
  const [collaborations, setCollaborations] = useState<CollaborationSession[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'messages' | 'collaborations'>('messages');

  // Subscribe to engine updates
  useEffect(() => {
    const unsubscribe = interDepartmentEngine.subscribe(() => {
      // Update messages and collaborations
    });
    return () => unsubscribe();
  }, []);

  // Render message feed or collaboration sessions
}
```

---

## 📈 Benefits

### 1. **Breaks Down Silos**
Departments don't work in isolation. They actively communicate and coordinate.

### 2. **Improves Transparency**
Everyone sees what other departments are doing and requesting.

### 3. **Faster Decision Making**
Urgent matters are flagged and addressed quickly.

### 4. **Better Coordination**
Cross-department projects are tracked and managed in real-time.

### 5. **Realistic Simulation**
Mimics how real organizations communicate and collaborate.

---

## 🚀 Usage

### Viewing All Messages

1. Click **🤝 Dept. Collaboration** in sidebar
2. Select **Messages** tab
3. Choose **All Departments** filter
4. Watch messages appear in real-time

### Filtering by Department

1. Click **🤝 Dept. Collaboration** in sidebar
2. Click on a specific department button (e.g., "💰 Finance")
3. See only messages involving that department

### Viewing Collaborations

1. Click **🤝 Dept. Collaboration** in sidebar
2. Select **Collaborations** tab
3. See active collaboration sessions
4. View participating departments and agents

---

## 📊 Statistics

The system tracks:
- **Total Messages**: All inter-department messages sent
- **Active Collaborations**: Currently active collaboration sessions
- **Departments**: Total number of departments (8)

---

## 🎨 Design Features

### Visual Design
- Glass-morphism cards
- Color-coded departments
- Priority-based borders
- Smooth animations
- Responsive layout

### UX Features
- Real-time updates
- Department filtering
- View mode toggle
- Timestamp display
- Related task information

---

## 🔮 Future Enhancements

### Potential Additions

1. **Direct Messaging**
   - Agents can send direct messages to specific agents
   - Private conversations between departments

2. **File Sharing**
   - Departments can share documents
   - Attach files to messages

3. **Meeting Scheduler**
   - Schedule cross-department meetings
   - Calendar integration

4. **Approval Workflows**
   - Formal approval processes
   - Multi-level approvals

5. **Analytics Dashboard**
   - Communication patterns
   - Collaboration frequency
   - Response times

---

## 📞 Support

### Common Questions

**Q: How often do departments communicate?**
A: Every 8-20 seconds, randomly selected departments exchange messages.

**Q: Can I filter messages by priority?**
A: Yes, urgent messages are highlighted in red, normal in blue, low in gray.

**Q: How do collaboration sessions start?**
A: They start automatically when the system detects a need for cross-department work (20% chance per interaction).

**Q: Can departments send messages to specific agents?**
A: Yes, messages can be directed to specific agents or entire departments.

---

## 🎉 Summary

The **Inter-Department Collaboration System** brings the NEAS Virtual Office to life by:

✅ Enabling real-time communication between all 8 departments  
✅ Creating dynamic collaboration sessions  
✅ Providing transparent visibility into cross-department workflows  
✅ Simulating realistic organizational communication patterns  
✅ Breaking down departmental silos  
✅ Improving coordination and decision-making  

**All departments now work together as a unified, collaborative organization!** 🤝

---

**Built with ❤️ by NEAS Development Team**  
**Powered by Agentic AI**  
**Version 1.1.0**  
**Status: PRODUCTION READY** 🚀
