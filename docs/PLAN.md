## High level steps for project

Part 1: Plan

Review all requirements and clarify open questions.  Analyze the existing frontend codebase and document its structure and conventions.
Expand this plan with detailed substeps for each project phase, including:
	Create frontend/CLAUDE.md describing the code structure, main components, and conventions.
	Present the enriched plan and CLAUDE.md to the user for approval before proceeding.
	The whole application will be hosted on Amazon Cloud Front and will use S3 for storage.
	The frontend is a React website that is already in progress in the /frontend directory.
	The backend should handle calls to Amazon Cognito and Amplify for authentication in production.
	The backend layer will securely handle member data and be used to connect to the database.  Amazon RDS should be used for the database.
	The backend will also be used to serve email requests to the AWS API Gateway which will call an AWS Lambda function to the AWS Simple Email Service.
	The Members Only area will include the following:
	- A link on the main member window to a form for members to update their contact information and submit to the database.
	- A link on the main member window which renders in the main window a list of upcoming member birthdays for the next 30 days.  Include a button on the newly rendered main window to return to the main member window.
	- A link on the main window which renders in the main window a link to a form which submits a new prayer request and a list of existing prayer requests.  Prayer requests will be individual text files stored on an S3 folder in AWS.  Inlcude a link in the newly rendered main window to return to the main member window.
	- A link on the main member window which renders in the main window a list of all the members, first and last name, email address, birthday and phone number.  Include a link in the newly rendered main window to return to the main member window.
	- A link on the main member window which renders in the main window a grid of all the council officers, their name, picture, and a button to send an email to each particular officer.  When the user selects the button to send an email to the particular officer a form should appear allowing the user to type in a text message to that officer with a send button.  When the send button is clicked  form should call the backend to send the email.  Include a link in the newly rendered main window to return to the main member window.
	- Include a link on the main member window to Nominate the Knight and Family of the Month.  When the link is clicked a form should appear with a text field to enter the Knight of the Month and another text field to enter the Family of the Month and a Send button.  When the Send button is clicked the form should call the backend to send the contents of the form in an email to all of the officers.
	- Include a link on the main member window which renders in the main window a list of all the Council Meeting Minutes.  The main window should render a list of all the meeting minutes files which are stored on an AWS S3 foldter with a link to each file.
	- When an individual meeting minute file is clicked the contents of that file should be rendered in the main window.  Include a button to return the main window to the Council Meeting Minutes rendering and a button to return to the main member window at the bottom of the main window.

Part 2: Scaffolding

Set up the backend in backend/ and stub out to integrate with AWS Amplify, and write the start and stop scripts in the scripts/ directory.  This should serve example static HTML to confirm that a "hello world" example works running locally and also make an API call.

Part 3: Add in Frontend

Now update so that the frontend is statically built and served, so that the app has the home page displayed at /.  Add the additional frontend pages planned from Step 1.  Include comprehensive unit and integration tests to confirm it is working.

Part 4: Add in a fake user sign in experience

Now update so that on first hitting the Members Only button the user needs to log in with dummy credentials ("user", "password") in order to see the content in that view, and can log out.  Build comprehensive tests and confirm they are passing.

Part 5: Database modeling

Now propose a database schema for the members saving it as JSON.  Document the database approach in docs/ and get user sign off.  The database schema should include the following fields for members:
 - First Name
 - Last Name
 - Address
 - Phone number
 - Birthday
 - Officer position (if any)
 - Email address
 - Member number
 - First degree date
 - Second degree date
 - Third degree date
 - Fourth degree date
 - Assembly number (if any)

Part 6: Backend

Now add API routes to allow the backend to read and execute the Members Only area for a given user, test this thoroughly with backend unit tests.

Part 7: Frontend + Backend

Now have the frontend actually use the backend API, so that the app is a proper web site where only a member with a proper login can access the Members Only content areas.  Test very thoroughly.

Part 8: Email connectivity

Now allow the backend to make an email call to send an email to an officer.  Test connectivity with a simple sample email and ensure the email call is working.  In production the backend will make a call to AWS Cognito and Amplify for member authentication.  When authenitcated the request will be passed to AWS API Gateway to call a Lambda function to the AWS Simple Email Service.

Part 9: Now extend the backend call so that it always calls the email or form submission with the JSON of the web site with the user's submission.  The Email or form submission should respond with a pop-up window that includes the response to the user that the attempt was successful or not and optionaly an update to the web site.  Test thoroughly.

