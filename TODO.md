# Hostelhub Join Requests & Student Select-Hostel Fix Plan

## Completed: 0/9

### Breakdown of Approved Plan:
1. **Verify DB structure** - Check JoinRequest counts by status, Student hostelStatus sync
2. **Update API /hostels/join-requests/route.js (GET)** - Ensure always returns all unless explicit status filter
3. **Fix JoinRequestsPanel.js** - Remove API status filter, fetch all + client-side filter
4. **Update approve/reject API routes** - Ensure Student hostelStatus sync, emit notifications
5. **Enhance AuthContext.js refreshUser** - Add retry logic, force context update post-approval
6. **Fix ProtectedRoute.js** - Add loading timeout/fallback to prevent infinite loader
7. **Update SelectHostelUI.js** - Force full refreshUser chain post-join
8. **Add auto-refetch to admin page.js** - Refetch after approve/reject actions
9. **Test E2E workflow** - Request → approve → student dashboard loads without blank/infinite

## Next Step: #1 Verify DB structure

