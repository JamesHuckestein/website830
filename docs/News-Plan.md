# Phase-2 Adding the News and Announcements

## News and Announcements Description
- This is a list of News and Announcements that are listed in boxes down the screen.  There is no interaction on the General View just a display where each announcement is in a box.  The Officers View allows any officer to add, edit or delete an announcement.

### General View
- The general view is accessed from the News and Announcements button on the left of the landing page.  When this button is clicked the announcements are listed in the main window.
- Any visitor can view the announcements in this view.
- Each announcement has the title in a box.
- When the user selects a particular announcement a pop-up window appears which displays the Title of the announcement at the top and the additional details in a field below.  There is a button at the bottom of the pop-up window to return to the News and Announcements main window.
- The announcements are automatically purged from the list on their expiration data.

### Members Only View
- When an Officer logs in to the Mebers Only area there is a button in the main window entitled "Edit Events & Announcements".
- When the officer clicks the "Edit Events & Announcements" button the current active announcements are shown in the main window.  At the bottom are buttons to Add, Edit and Delete.
- When the officer selects the Add button a pop-up window appears with fields to enter the "Date to Delete", "Title" and "Event / Announcement Details".  There are two buttons at the bottom of the form where the officer can "Cancel" or "Save".  If the Cancel button is selected the pop-up window closes and returns to the Edit Events & Announcements main window.  If the Save button is selected the pop-up window closes and returns to the Edit Events & Announcements main window, and the newly created announcement is added to the General View News and Announcements main window.  The Date to Delete field is required before the Save button can be clicked.
- When the officer selects a particular announcement in the main window and clicks the Edit button a pop-up window appears with the details for that announcement.  The officer can change the Date to Delete, Title or Event / Announcement Details fields.  If the Save button at the bottom of the form is selected the pop-up window closes and returns to the Edit Events & Announcements main window, and the newly created announcement is added to the General View News and Announcements main window.  If the Cancel button is selected the pop-up window closes and returns to the Edit Events & Announcements main window.
- When the officer selects a particular announcement in the main window and clicks the Delete button a pop-up window appears with the text "Confirm the delete?".  If the officer selects the Cancel button the pop-up window closes and returns to the Edit Events & Announcements main window.  If the Delete button is pressed the pop-up window is closed, the announcement is deleted from both the General View News and Announcements main window and the Edit Events & Announcements main window.

## Part 1: Plan
 - Analyze the frontend and backend code base.
 - Document the proposed changes in CLAUDE.md.
 - Expand the new plan with additional substeps.
 - Clarify any questions and get user approval before making any code changes.

## Part-2 Backend Scaffolding
- Add the routes needed for the News and Announcements.
- Add Pytest unit tests.

## Part 3: General View UI (front end)
- Update the News and Announcements main window view so that expired or deleted announcements are not viewable.
- Add a couple of example events to the current News and Announcements view.

## Part 4: Officer View UI (front end)
 - Add the officer news and announcements view to the frontend.
 - Add the buttons specific to the officer view to the update news and announcements.
 - Add the pop-up forms used to add, edit and delete new announcements and events using dummy data.

## Part 5: Demo Login
- Add unit tests to ensure general visitors and regular members are not able to access the update news and announcements view that only officers are able to see.

## Part 6: Database Schema
- Extend the database schema to store the news and events and keep track of their delete date.

## Part 7: Backend API Routes
- Extend the API Routes so that officers can add, edit, and delete news and announcements.

## Part 8: Frontend + Backend Integration
- Replace dummy data in add, edit and delete components in the officer update news and announcements area with API calls.
 - Unit tests mock the API; E2E tests hit the real running backend
 - Database is updated when forms are submitted

## Part 9: Full Form Submission with Response UI
- Backend returns `{success: boolean, message: string}` on all write endpoints
- Frontend shows a modal after each submission: success or error message
- Modal has a dismiss button; forms reset on success