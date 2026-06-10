# Phase-2 Adding the Photo Gallery

## Photo Gallery Description
- This is a list of Photos in the same box format as the Officer photos that are listed in two columns of boxes down the screen.  There is no interaction on the General View just a display where each photo with a title in a box.  The Officers View allows any officer to add, edit or delete a photo.

### General View
- The general view is accessed from the Photo Galleries button on the left of the landing page.  When this button is clicked the photos are listed in the main window in two columns similar to the Officers page.
- Any visitor can view the photos in this view.
- Each photo has the title in a box.
- The photos are displayed with the most recent additions at the bottom of the two columns.

### Members Only View
- When an Officer logs in to the Mebers Only area there is a button in the main window entitled "Edit Photo Gallery".
- Non officer members are not able to see the Edit Photo Gallery button and are not allowed access to this functionality.
- When the officer clicks the "Edit Photo Gallery" button the current active photos are shown in the main window.  At the bottom are buttons to Add, Edit and Delete.
- When the officer selects the Add button a pop-up window appears with fields to enter the "Title" and "Upload Photo".  There are two buttons at the bottom of the form where the officer can "Cancel" or "Save".  If the Cancel button is selected the pop-up window closes and returns to the Edit Photo Gallery main window.  If the Save button is selected the pop-up window closes and returns to the Edit Photo Gallery main window, and the newly uploaded photo is added to the General Photo Gallery main window.  The Title and Upload Photo fields are required before the Save button can be clicked.
- When the Upload Photo field is used in either the Add or Edit form the user can either drag and drop a file into the field or navigate the folder directory to select a file to upload in jpeg, png, webp, gif, or tiff formats.
- When the officer selects a particular photo in the main window and clicks the Edit button a pop-up window appears with the details for that photo.  The officer can change the Title or Upload a replacement Photo.  If the Save button at the bottom of the form is selected the pop-up window closes and returns to the Edit Photo Gallery main window, and the newly created photo is added to the General Photo Gallery main window.  If the Cancel button is selected the pop-up window closes and returns to the Edit Photo Gallery main window.
- When the officer selects a particular photo in the main window and clicks the Delete button a pop-up window appears with the text "Confirm the delete?".  If the officer selects the Cancel button the pop-up window closes and returns to the Edit Photo Gallery main window.  If the Delete button is pressed the pop-up window is closed, the photo is deleted from both the General Photo Gallery main window and the Edit Photo Gallery main window.

## Part 1: Plan
 - Analyze the frontend and backend code base.
 - Document the proposed changes in CLAUDE.md.
 - Expand the new plan with additional substeps.
 - Clarify any questions and get user approval before making any code changes.

## Part-2 Backend Scaffolding
- Add the routes needed for the Photo Gallery.
- Add Pytest unit tests.

## Part 3: General View UI (front end)
- Update the Photo Gallery main window view so that deleted photos are not viewable.
- Add a couple of example photos to the current Photo Gallery view.

## Part 4: Officer View UI (front end)
 - Add the officer Edit Photo Gallery view to the frontend.
 - Add the buttons specific to the officer view to the update photo gallery.
 - Add the pop-up forms used to add, edit and delete new photos to the gallery using dummy data.

## Part 5: Demo Login
- Add unit tests to ensure general visitors and regular members are not able to access the update photo gallery view that only officers are able to see that menu.

## Part 6: Database Schema
- Extend the database schema to store the links for the photos.  The photos themselves will be stored in a separate S3 folder in production.

## Part 7: Backend API Routes
- Extend the API Routes so that officers can add, edit, and delete photos.

## Part 8: Frontend + Backend Integration
- Replace dummy data in add, edit and delete components in the officer edit photo gallery
 area with API calls.
 - Unit tests mock the API; E2E tests hit the real running backend
 - Database is updated when forms are submitted

## Part 9: Full Form Submission with Response UI
- Backend returns `{success: boolean, message: string}` on all write endpoints
- Frontend shows a modal after each submission: success or error message
- Modal has a dismiss button; forms reset on success