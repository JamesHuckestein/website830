# Phase-2 Adding the Calendar

## Calendar Description
 - This is an interactive calendar view where users see the current month displayed where the days are boxes on the screen.  When an event is scheduled for a particular day a link will be displayed in the box for that day.  When the user clicks on the link a pop-up window will appear on the screen which shows more information about the event.

### General View
 - The user does not login to the members only area of the website.
 - Access via the Calendar button on the left pane of the main window.
 - When a visitor clicks the Calendar button the calendar displays in the main window.
 - The current month is displayed as boxes where Mondays are the column on the left followed by Tuesdays, Wednesdays, Thursdays, Fridays, Saturdays and Sundays being the column on the right.
 - The number of the day of the month is shown in the box at the top left of each individual box.
 - The boxes not used for days of the month do not have a number in the top left of the box.  For example, if the first day of the month is on a Wednesday the Monday and Tuesday boxes to the left of the first day on the same row will not have any numbers in them.
 - The calendar defaults to showing the current month and updates automatically by the current date.
 - At the top of the calendar there is a left arrow button which allows the user to update the display back to the previous month and a right arrow button which allows the user to update the display to the next upcoming month.
 - When an event has been submitted for a particular day on the calendar the title of the event will be shown in the calendar box as a link.
 - When the user clicks on a particular link in on the calendar a pop-up box will appear with the Title of the event at the top and a text field with the details of the event below.  At the bottom of the pop-up window will be a Close button which closes window and returns the main window to the calendar view.


### Members Only View
 - The user must be logged in to the members only area of the website and must be one of the council officers to see this view.
 - When an officer is logged in the landing page contains an additional button called the Calendar Updates button.
 - When the Calendar Updates button is selected the main window shows a view very similar and synchronized with the general calendar view.
 - At the bottom of the calendar there are three buttons Add, Edit and Delete.
 - If no box for a particular day is selected and one of the three buttons at the bottom of the calendar is selected a pop-up window will appear saying "Please select a day first."
 - When the officer selects a day box on the calendar the box will be highlighted.
 - When a day is highlighted on the calendar and the Add button is clicked a pop-up form window will appear where the user can enter text for the Title and the Description.  When the Save button is clicked on this form the entry text will be saved and the title will be displayed on the Members Only View and the General View.
 - When a day is highlighted on the calendar and the Edit button is clicked a pop-up form window will appear with the Title and Description already populated with the previously entered text.  When the Save button is clicked on this form the updated entry text will be saved and the title will be displayed on the Members Only View and the General View.
 - When a day is highlighted on the calendar and the Delete button is clicked a pop-up window will appear with the text "Will you confirm?" and a Yes button and No button.  If the Yes button is selected the Title and Description will be deleted.  The General View and the Members Only View will have the Title deleted from the calendar.  If the No button is selected the pop-up window will close and no further action will be taken.

## Part 1: Plan
 - Analyze the frontend and backend code base.
 - Document the proposed changes in CLAUDE.md.
 - Expand the new plan with additional substeps.
 - Clarify any questions and get user approval before making any code changes.

## Part 2: Backend Scaffolding
 - Extend the backend to account for the new calendar features.
 - Write Pytest unit tests for the new features.

## Part 3: General View UI (front end)
 - Add the general calendar view to the frontend that any visitor can view.
 - Add a couple of example events to the current month calendar.

## Part 4: Officer View UI (front end)
 - Add the officer calendar view to the frontend.
 - Add the buttons specific to the officer view to the calendar.
 - Add the pop-up forms used to add, edit and delete new events using dummy data.

## Part 5: Demo Login 
 - Add unit tests to ensure general visitors and regular members are not able to access the Calendar Updates view that only officers are able to see.

## Part 6: Database Schema
 - Update the database schema to keep track of the events and their titles.

## Part 7: Backend API Routes
 - Update the backend to keep track of the current date and month.
 - Update the routes so that officers can add, edit and update events to the calendar.

## Part 8: Frontend + Backend Integration
 - Replace dummy data in add, edit and delete components in the officer calendar updata area with API calls.
 - Unit tests mock the API; E2E tests hit the real running backend
 - Database is updated when forms are submitted
 

## Part 9: Full Form Submission with Response UI
- Backend returns `{success: boolean, message: string}` on all write endpoints
- Frontend shows a modal after each submission: success or error message
- Modal has a dismiss button; forms reset on success