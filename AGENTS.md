# KoC React Project

## Business Requirements

- An MVP of a Knights of Columbus web site with member login capabilities 
- The web site should have an information banner at the top showing the KoC logo and Council number 830 address
- The left side of the main page should have a vertical list of selectable buttons for Home, About Our Council, Officers, Prayer Requests, Events Calendar, News & Announcements, Photo Galleries, Links of Interest, Catholicism, Members Login, Assembly Sites, State Council Site, and Supreme Council Site
- When one of the buttons on the vertical list of buttons is selected the main window should display the content
- The main window defaults to the Home display when the web site first renders
- When the Home display is rendered the main window shows a picture of the each of the 14 council officers with their titles in a revolving display
- When the Members Login is selected the main window displays a form to enter the membership number in one box and the passcode in a second box
- After successful members login the main window displays 
- The web site should open with dummy data populated for the main window

## Technical Details

- Implemented as a modern NextJS app, client rendered
- The NextJS app should be created in a subdirectory `frontend`
- No persistence
- User management for the MVP for the Members Only content area
- Use popular libraries
- As simple as possible but with an elegant UI

## Color Scheme

- Accent Yellow: `#BFA149` - accent lines, highlights, button background
- Blue Primary: `#4169E1` - links, key sections, header background
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Strategy

1. Write plan with success criteria for each phase to be checked off. Include project scaffolding, including .gitignore, and rigorous unit testing.
2. Execute the plan ensuring all critiera are met
3. Carry out extensive integration testing with Playwright or similar, fixing defects
4. Only complete when the MVP is finished and tested, with the server running and ready for the user

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
