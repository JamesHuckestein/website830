# Update Email Format

## Description
The intention is to convert the emails sent from the web site using SES from a simple text format to an html format.  This will include using a header at the top and a footer at the bottom of each email to make the emails more aesthetically appealing.

## Part 1: Plan
 - Analyze the frontend and backend code base.
 - Document the proposed changes in EmailPlan.md once approved by appending at the bottom of the file.
 - Expand the new plan with additional substeps.
 - The file emailForm.html is located in the Downloads directory of this laptop and is the example of what an email should look like.
 - The KoCLogo.png file is in the Downloads directory on this laptop and is the png file referenced in emailForm.html.
 - Clarify any questions and get user approval before making any code changes.

 ## Part 2: View UI (front end)
 - The email forms used in the Officers page, after logging into the members only area - send email button are not required to display the footer and header information where the user enters their text message.
 - The email forms used in the Member List page, after logging into the members only area - send email button are not required to display the footer and header information where the user enters their text message.

## Part-3 Backend
- When the user clicks the send button for an email to an officer or to all of the members in the members list for a mass email, the text message is inserted into the emailForm.html where it says "This is where the body of the email will go." and sent to SES.
- Add new test or update existing test cases to ensure adding this format to the email does not break existing functionality.
