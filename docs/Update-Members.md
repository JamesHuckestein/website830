# Phase-2 Update Members

## Update Members Description
- This functionality allows the Grand Knight, Deputy Grand Knight, Recorder and Financial Secretary to make updates to the list of members.  There are additional buttons for the added functionality at the bottom of the Members List view.  When one of the privileged officers logs into the Members Only area and clicks the Members List the view in the main window will allow them to add, edit or delete the information for any member.  When they successfully make an update the change will be made to the database and relfected on the Members List.

### General Member View
- Members must login using the Members Only button on the left navigation pane. 
- The member can select the Member List button from the main window and the list of members is shown in the main window.
 - The main window should only show a maximum of 25 entries at any time and have a slider bar on the left side to allow the user to scroll up and down through the list.
- Add for every member is a selector window at the top of the screen.  This selector window is used so the user can type the name of the desired member and easily find that person to select in the main list.

### Privileged Officer View
- The Grand Knight, Deputy Grand Knight, Recorder and Financial Secretary are the only four members who can see the additional buttons described below on the Members List.
- All other officers and non officer members are not able to see the additional buttons below and are not allowed access to this functionality.
- The privileged officers see the additional Add, Edit, and Delete buttons at the bottom of the screen.
- The privileged officer may use the selector window to search for a particular member in the list.
- Once selecting a particular member from the list the privileged officer can select the edit or delete button to update that member.
- When a privileged officer adds or edits a member they are able to fill in the following fields for the member:
  | Configurable Fields | Optional or Required |
  | --- | --- |
  | member_number | required |
  | password | optional |
  | first_name | required |
  | last_name | required |
  | address_steet | required |
  | address_city | required |
  | address_state | required |
  | address_zip | required |
  | phone | |
  | birthday | required |
  | email | |
  | assembly_number| |
  | first_degree_date | required |
  | second_degree_date | required |
  | third_degree_date | required |
  | fourth_degree_date | |
- When the officer selects the Add button no name is selected from the list.  A pop-up window appears with all of the fields shown above for the added member. All of the required fields must be present before the Save button can be selected. When the Save button at the bottom is selected the database and Member List will be updated.  If the Cancel button at the bottom is selected the pop-up window will close and the view returns to the Member List.
- When the officer selects a member from the Member List and clicks the Edit button at the bottom, a pop-up window will appear with the retrieved values from the database populated for the configurable fields above.  The privileged officer may change the values in any of the fields and all of the required fields must be filled-in before clicking the Save button at the bottom of the pop-up window.  When the Save button is selected the database and Members List will be updated. If the officer clicks the Cancel button at the bottom of the pop-up window, the pop-up window closes and returns to the Member List view.
- The officer_position field is not included in the pop-up window for the Add and Edit functions above.  When a member is added this field will be set to default.  When an existing member is edited this field will not be changed.
- The password field maps to the passcode_hash field in the schema.  The following points describe the scenarios for using this field.
- When a new member is added the user will add a text password in this field that is required before saving.  Upon Save the text password will be converted into the proper passcode_hash before being saved in the database.  
- When an existing member is edited the password field is optional.  The password_hash will not be retrieved from the database and displayed in the password field on the pop-up window.  If the officer leaves the password field blank no change will be made in the database to the members passcode_hash when the Save button is clicked.  If the officer enters text into the password field the text will be converted into the proper passcode_hash before being saved into the database.

## Part 1: Plan
 - Analyze the frontend and backend code base.
 - Document the proposed changes in CLAUDE.md once approved.
 - Expand the new plan with additional substeps.
 - Clarify any questions and get user approval before making any code changes.

## Part-2 Backend Scaffolding
- Add the routes needed for the update Members List buttons.
- Add Pytest unit tests.

## Part 3: General View UI (front end)
 - Add the search window for all members in the Member List to the frontend.
 - Add the privileged officer Members List view to the frontend.
 - Add the pop-up forms used to add, edit and delete members to the Members List view using dummy data.

 ## Part 4: Demo Login
- Add unit tests to ensure general visitors, other officers and regular members are not able to access the Members List view that only the privileged officers are able to see.

## Part 5: Database Schema
- Extend the database schema to account for when to retrieve the passcode_hash and when it should not be retrieved and displayed.
- Extend the database schema to transform the text entered password into the appropriate passcode_hash when a member is added or edited.

## Part 6: Backend API Routes
- Extend the API Routes so that privileged officers can add, edit and delete members.

## Part 7: Frontend + Backend Integration
- Replace dummy data in add and edit save components in the privileged officer Member List view with API calls.
 - Unit tests mock the API; E2E tests hit the real running backend
 - Database is updated when forms are submitted

## Part 8: Full Form Submission with Response UI
- Backend returns `{success: boolean, message: string}` on all write endpoints
- Frontend shows a modal after each submission: success or error message
- Modal has a dismiss button; forms reset on success