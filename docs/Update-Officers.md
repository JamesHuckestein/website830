# Phase-2 Update the Existing Officers

## Update Officers Description
- This functionality allows the Grand Knight, Deputy Grand Knight, Recorder and Financial Secretary to make updates to the list of Officers.  There is no interaction on the General Officers tab on the left navigation pane, or in the Members Only area Officers tab on the left navigation pane.  When changes are made in the Update Officers form the changes will be reflected for any visitor to view in both the general and members only Officer tabs on the left navigation pane.  The Update Officers button which is only visible to specific officers allows those officers to edit any of the officer positions which will be saved in the database and the Officers tabs.

### General View
- The general view is accessed from the Officers button on the left of the landing page.  When this button is clicked the boxes for all the Officers appear as previously developed.
- When one of the four privileged officers saves changes in the Update Officeers form the changes will be reflected in this view.


### Members Only View
- When a member logs in to the Members Only view they will be able to see the Officers button as previously developed.  When changes are made in the Update Officers form the view in this Officers view will be updated as well.
- The Grand Knight, Deputy Grand Knight, Recorder and Financial Secretary are the only four members who can see and have access to the Update Officers button after logging in to the Members Only area.
- All other officers and non officer members are not able to see the Update Officers button and are not allowed access to this functionality.
- When one of the privileged officers clicks the Update Officers button the current active officer photos with title and boxes are shown in the main window.  At the bottom of each officer box is an Edit button which is used to edit that particular officer position.
- When an officer selects the edit button for a particular officer position a pop-up window appears.  The form in the window has a Member Name field and an Upload Photo field.  There are also Save and Cancel buttons at the bottom of the form.  The following text is also displayed on the form: "Please select a Member from the list and a valide photo to upload.  Only PNG formatted photos are allowed."
- When the officer selects the Name field a list of all the members names are listed in the selector menu.  The officer can start typing the desired name to filter out and see only the remaining matching names, or scroll through the selector menu list and select the desired name.  The name field is required before the Save button can be selected.
- When the officer clicks the Upload Photo field the menu allows the user to select a PNG file from their device to upload to the site.  A valid PNG file must be selected for upload before the Save button can be selected.
- When the Cancel button is selected the pop-up form closes and returns to the Update Officers menu without making any changes.
- When the Save button is selected the name associated with that officer position is updated in the database, on the general Officers tab, on the Members Only Officers tab, and on the Update Officers window.  The photo is uploaded and stored on the site.  The photo associated with that officer position is changed to the newly uploaded photo on the General view Officers tab, Members Only Officers tab, and on the Update Officers window view.

## Part 1: Plan
 - Analyze the frontend and backend code base.
 - Document the proposed changes in CLAUDE.md once approved.
 - Expand the new plan with additional substeps.
 - Clarify any questions and get user approval before making any code changes.

## Part-2 Backend Scaffolding
- Add the routes needed for the Update Officers button.
- Add Pytest unit tests.

## Part 3: General View UI (front end)
 - Add the officer Update Officers view to the frontend.
 - Add the Update Officers button specific for the privileged officers to the main window when they log in.
 - Add the pop-up forms used to edit and save new photos to the update officers view using dummy data.

## Part 4: Demo Login
- Add unit tests to ensure general visitors, other officers and regular members are not able to access the Update Officers view that only the privileged officers are able to see that menu.

## Part 5: Database Schema
- Extend the database schema to store the links for the officer photos.  The photos themselves will be stored in a separate S3 folder in production.

## Part 6: Backend API Routes
- Extend the API Routes so that officers can edit each officer position.

## Part 7: Frontend + Backend Integration
- Replace dummy data in edit and save components in the officer Update Officer view with API calls.
 - Unit tests mock the API; E2E tests hit the real running backend
 - Database is updated when forms are submitted

## Part 8: Full Form Submission with Response UI
- Backend returns `{success: boolean, message: string}` on all write endpoints
- Frontend shows a modal after each submission: success or error message
- Modal has a dismiss button; forms reset on success