# Auxiliar Officer Positions

## Description
- The need to have appointed positions where an individual may benefit from having officer privileges on the website has been identified.  In this case it is desirable for one of the privileged officers and Admin be able to grant regular officer privileges to another member.  For this reason a new button will be added to the privileged officers display where they can access this functionality through a new pop-up window interaction to grant or remove officer privileges to members who are not on the official officer list.

## General View
The general visitors to the site and regular members are not able to see the auxiliar officer privileges functionality.

## Members Only View
General members are not able to access this functionality.  When a privileged officer or Admin logs into the site:
- An additional button is added at the bottom of the main page entitled "Auxiliary Officer Privileges".
- When the privileged officer selects this link a pop-up window appears in the main window.
- The pop-up window is titled "Auxiliary Officer Privileges".  Below the title is the following text: "This menu allows the officers to grant elevated privileges to members with appointed positions on the website."  
- At the top left there is a Back button which returns the user back to the Members Area landing page for privileged officers.
- Below this text is a text entry field titled Member Name.  The Member Name field is similar in behavior to the Update Officers area where a list of matching member names appears when the user begins typing in a name.  
- Below the Member Name field are several buttons - Grant, Deny, and Cancel.  Once a member who is not an existing officer is entered in the Member Name field the Grant and Deny buttons become active for selection.  The Cancel button is always active.
- When the Grant button is selected the member is given officer privileges on the website.
- When the Deny button is selected the member has their existing officer privileges revoked (if any) on the website and returns to having normal member privileges.
- When the Cancel button is selected the window closes and returns to the main privileged officer landing page without making any updates to a member.
- When a user types in a name to the Member Name field and selects either the Grant or Deny button a logic check will be performed before updating the database.  If the name matches one of the existing officer positions a response pop-up will appear with the text: "This member is already an officer and their privileges may not be altered here."  When the user clicks the Close button on this pop-up menu the display will return to the Auxiliary Officer Privileges landing page in the main window.
- Members with Auxiliary Officer Privileges granted may appear in other text sections of the web-site, but do not appear on the Officers Page or the rotary display of officers.

## Plan
- Analyze the front end and back end code base.
- Document the proposed code changes in CLAUDE.md once approved.
- Expand the basic plan with additional sub steps.
- Clarify any questions and get approval before making any code changes.
- Basic plan is to add a boolean field (e.g., is_auxiliary_officer) to the member record. Then modify _is_officer in main.py to return True if the member holds a position in OFFICER_TITLES or has that flag set. The JWT would include isOfficer: True, granting them access to calendar events, announcements, photos, etc. but since they have no entry in the officers table and no title in OFFICER_TITLES_ORDERED, they'd never appear on the public officers grid.  This does not affect privileged operations (member management, officer updates) since those check _require_privileged_officer, which specifically requires the position to be GK, DGK, Recorder, or FS.

## Backend Infrastructure
- Add the routes to ensure no additional changes are needed.
- Add Pytest unit tests for the added functionality.

## Database Schema
- Add a boolean field (e.g., is_auxiliary_officer) to the member record in DynamoDB.

## Update the Frontend
- Add the additional button and pop-up windows to the privileged officers landing page.

## Backend API Routes
- Check the API Routes so that officers can Grant and Deny auxiliary officer privileges to non-officer members.

## Frontend and Backend Integration
- Ensure that privileged officers can not modify existing officers privileges through the auxiliary officer privileges area.