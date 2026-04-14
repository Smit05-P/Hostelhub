# Quick Reference: Hostel Join System

## 🔧 API Quick Reference

### Student: Join via Code
```bash
curl -X POST http://localhost:3000/api/hostels/join \
  -H "Content-Type: application/json" \
  -d '{
    "joinCode": "HSTAB23X",
    "userId": "user-uuid"
  }'
```

### Student: Search Hostels
```bash
curl http://localhost:3000/api/hostels/search?query=hostel+name
```

### Student: Send Join Request
```bash
curl -X POST http://localhost:3000/api/hostels/join-requests \
  -H "Content-Type: application/json" \
  -d '{
    "hostelId": "hostel-uuid",
    "userId": "user-uuid"
  }'
```

### Admin: Get Join Requests
```bash
curl "http://localhost:3000/api/hostels/join-requests?hostelId=hostel-uuid&status=pending"
```

### Admin: Approve Request
```bash
curl -X POST http://localhost:3000/api/hostels/join-requests/request-uuid/approve \
  -H "Content-Type: application/json" \
  -d '{
    "hostelId": "hostel-uuid",
    "userId": "student-uuid"
  }'
```

### Admin: Get Members
```bash
curl "http://localhost:3000/api/hostels/hostel-uuid/members?status=approved"
```

### Admin: Regenerate Code
```bash
curl -X POST http://localhost:3000/api/hostels/hostel-uuid/regenerate-code
```

---

## 📱 Component Quick Reference

### Import Components
```jsx
import JoinHostelModal from "@/components/JoinHostelModal";
import JoinRequestsPanel from "@/components/JoinRequestsPanel";
import HostelSettingsPanel from "@/components/HostelSettingsPanel";
```

### Use JoinHostelModal
```jsx
const [showJoin, setShowJoin] = useState(false);

<JoinHostelModal
  isOpen={showJoin}
  onClose={() => setShowJoin(false)}
  onSuccess={() => {
    // Refresh data, navigate, etc.
  }}
/>
```

### Use JoinRequestsPanel
```jsx
<JoinRequestsPanel hostelId={hostelId} />
```

### Use HostelSettingsPanel
```jsx
<HostelSettingsPanel 
  hostelId={hostelId} 
  hostelName={hostel.hostelName}
/>
```

---

## 🎨 Component States

### JoinHostelModal States
```
- Method: "code" | "search"
- Loading: true | false
- Success: shows toast notification
- Error: shows error message
```

### JoinRequestsPanel States
```
- Filter: "pending" | "approved" | "rejected"
- Loading: true | false
- ActioningId: string (which request is being processed)
```

### HostelSettingsPanel States
```
- Loading: true | false
- Saving: true | false
- Settings: { hostelName, autoApprove, joinCode }
```

---

## 🔑 Key Database Fields

### Users Collection
```javascript
{
  uid: "string",
  name: "string",
  email: "string",
  role: "student" | "admin",
  hostelId: "string", // Current hostel membership
  // ... other fields
}
```

### Hostels Collection
```javascript
{
  id: "string",
  hostelName: "string",
  joinCode: "string", // e.g., "HSTAB23X"
  autoApprove: boolean,
  adminId: "string",
  status: "Active" | "Inactive",
  // ... other fields
}
```

### HostelMembers Collection (NEW)
```javascript
{
  id: "string",
  userId: "string",
  hostelId: "string",
  role: "member" | "admin",
  status: "pending" | "approved",
  joinedAt: Timestamp,
  updatedAt: Timestamp
}
```

### JoinRequests Collection (NEW)
```javascript
{
  id: "string",
  userId: "string",
  userName: "string",
  hostelId: "string",
  status: "pending" | "approved" | "rejected",
  reason: "string", // rejection reason
  requestedAt: Timestamp,
  respondedAt: Timestamp
}
```

---

## 🎯 Common Tasks

### Task: Make JoinHostelModal appear
```jsx
const [showJoin, setShowJoin] = useState(false);

return (
  <>
    <button onClick={() => setShowJoin(true)}>
      Join Hostel
    </button>
    <JoinHostelModal isOpen={showJoin} onClose={() => setShowJoin(false)} />
  </>
);
```

### Task: Add admin approval panel
```jsx
return <JoinRequestsPanel hostelId={hostelId} />;
```

### Task: Add hostel settings
```jsx
return <HostelSettingsPanel hostelId={hostelId} hostelName={name} />;
```

### Task: Join hostel programmatically
```javascript
const response = await axios.post("/api/hostels/join", {
  joinCode: "HSTAB23X",
  userId: user.uid,
});
console.log(response.data);
```

### Task: Approve join request
```javascript
await axios.post(
  `/api/hostels/join-requests/${requestId}/approve`,
  { hostelId, userId }
);
```

### Task: Get student's hostels
```javascript
const response = await axios.get(`/api/hostels/join?userId=${userId}`);
const hostels = response.data.hostels;
```

---

## ⚠️ Error Codes

```
400 - Bad Request (missing fields, invalid input)
404 - Not Found (invalid code, hostel not found)
409 - Conflict (already member, pending approval)
500 - Server Error (database issue)
```

## 📋 Error Messages (Student Friendly)

```javascript
"Invalid join code. Hostel not found."
"You are already a member of this hostel."
"Your join request is pending approval."
"Your previous request was rejected. Contact the hostel admin."
"Join request submitted. Please wait for admin approval."
```

---

## 🚀 Deploy Checklist

- [ ] All functions exported from firestore.js
- [ ] All API routes created and tested
- [ ] Components properly imported and used
- [ ] Firestore rules deployed
- [ ] Environment variables set
- [ ] Error handling verified
- [ ] Loading states working
- [ ] Notifications configured
- [ ] UI styled consistently
- [ ] Tested all flows

---

## 💾 Database Indexes (if needed)

For better performance, create these Firestore composite indexes:

```
hostelMembers:
- hostelId (Ascending) + status (Ascending)
- userId (Ascending) + status (Ascending)

joinRequests:
- hostelId (Ascending) + status (Ascending)
- userId (Ascending) + status (Ascending)
```

---

## 🎓 Learning Path

1. **Understand the Architecture** - Read HOSTEL_JOIN_SYSTEM.md
2. **Review Firestore Functions** - Check src/lib/firestore.js
3. **Explore API Endpoints** - Test with curl/Postman
4. **Integrate Components** - Add to your pages
5. **Customize Styling** - Match your design
6. **Test All Flows** - Use testing checklist
7. **Deploy** - Go live!

---

## 📞 Debugging Tips

### Join code shows as "Invalid"
- Check if code is being converted to uppercase
- Verify hostel exists in database
- Check hostel status is "Active"

### "Already a member" error
- Check hostelMembers collection
- Look for existing membership record
- Verify status field

### Requests not appearing for admin
- Check hostelId parameter
- Verify joinRequests collection has records
- Check Firestore rules allow admin read access

### Notifications not sending
- Check notifications collection rules
- Verify recipientId or recipientRole is set
- Look for hardcoded hostel IDs

### Component not updating after action
- Ensure onSuccess callback is triggered
- Check loading state is false
- Verify API response is successful

---

## 📊 Useful Firestore Queries

### Get all pending requests for hostel
```javascript
const q = query(
  collection(db, "joinRequests"),
  where("hostelId", "==", hostelId),
  where("status", "==", "pending")
);
```

### Get all members of a hostel
```javascript
const q = query(
  collection(db, "hostelMembers"),
  where("hostelId", "==", hostelId),
  where("status", "==", "approved")
);
```

### Get hostels joined by student
```javascript
const q = query(
  collection(db, "hostelMembers"),
  where("userId", "==", userId),
  where("status", "==", "approved")
);
```

---

## 🔄 State Management Example

```jsx
const [hostels, setHostels] = useState([]);
const [loading, setLoading] = useState(false);

const fetchHostels = async () => {
  setLoading(true);
  try {
    const response = await axios.get(`/api/hostels/join?userId=${userId}`);
    setHostels(response.data.hostels);
  } catch (error) {
    toast.error(error.response?.data?.error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchHostels();
}, [userId]);
```

---

## 🎉 Success! You're Ready

Your Hostel Hub SaaS connection system is fully implemented and ready to:
- ✅ Create hostels with unique codes
- ✅ Allow students to join securely
- ✅ Support flexible approval workflows
- ✅ Maintain multi-tenant isolation
- ✅ Scale to thousands of hostels

Good luck! 🚀
