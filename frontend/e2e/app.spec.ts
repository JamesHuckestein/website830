import { expect, test } from "@playwright/test";

test("default home, section navigation, and member login flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Council 830 Leadership" })).toBeVisible();

  await page.getByRole("button", { name: "News & Announcements" }).click();
  await expect(page.getByRole("heading", { name: "News & Announcements" })).toBeVisible();

  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301001");
  await page.getByLabel("Passcode").fill("faith830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

test("members area shows all 7 sub-section links after login", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301001");
  await page.getByLabel("Passcode").fill("faith830");
  await page.getByRole("button", { name: "Sign In" }).click();

  const main = page.getByRole("main");
  await expect(main.getByRole("button", { name: "Contact Information" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Birthdays" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Prayer Requests" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Member List" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Officers" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Knight and Family of the Month" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Meeting Minutes" })).toBeVisible();
});

test("contact information sub-section navigates and returns", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301001");
  await page.getByLabel("Passcode").fill("faith830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("button", { name: "Contact Information" }).click();
  await expect(page.getByRole("heading", { name: "Contact Information" })).toBeVisible();

  await page.getByRole("button", { name: "Back to Members Area" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
});

test("prayer requests sub-section shows requests and accepts new submission", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301001");
  await page.getByLabel("Passcode").fill("faith830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("main").getByRole("button", { name: "Prayer Requests" }).click();
  await expect(page.getByRole("heading", { name: "Prayer Requests" })).toBeVisible();
  await expect(page.getByText(/Tom Brady/)).toBeVisible();

  await page.getByPlaceholder("Enter your prayer intention...").fill("Test prayer intention.");
  await page.getByRole("button", { name: "Submit" }).click();

  // Success modal appears
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await expect(page.getByText("Prayer request submitted.")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();

  // New request appears in list after modal is dismissed
  await expect(page.getByText("Test prayer intention.")).toBeVisible();

  await page.getByRole("button", { name: "Back to Members Area" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
});

test("member can delete own prayer request and it disappears from the public list", async ({ page }) => {
  // Log in as 8301004 (owns the "Tom Brady" seed prayer request)
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301004");
  await page.getByLabel("Passcode").fill("hope830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("main").getByRole("button", { name: "Prayer Requests" }).click();
  await expect(page.getByText(/Tom Brady/)).toBeVisible();

  // Tom Brady row is owned by this member — its checkbox is the first one
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Delete Selected (1)" }).click();
  await expect(page.getByRole("heading", { name: "Delete prayer request(s)?" })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText(/Tom Brady/)).not.toBeVisible();

  // Log out and verify the public prayer-requests view also reflects the delete
  await page.getByRole("button", { name: "Back to Members Area" }).click();
  await page.getByRole("button", { name: "Logout" }).click();
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Prayer Requests" }).click();
  await expect(page.getByRole("heading", { name: "Prayer Requests" })).toBeVisible();
  await expect(page.getByText("Current Intentions")).toBeVisible();
  await expect(page.getByText(/Tom Brady/)).not.toBeVisible();
});

test("officer can delete another member's prayer request", async ({ page }) => {
  // Grand Knight 8301002 (officer) deletes a request owned by 8301006
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("main").getByRole("button", { name: "Prayer Requests" }).click();
  const targetText = /community center|first responders|comfort|Smith|parish|home/i; // any seed text other than Tom Brady is fine
  await expect(page.getByText(targetText).first()).toBeVisible();

  // Every checkbox is rendered for an officer; pick the row matching id 0002 (submitted by 8301006)
  const targetRow = page.getByRole("listitem").filter({ has: page.getByLabel("Select prayer request a1b2c3d4-0002-0000-0000-000000000002") });
  await targetRow.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Delete Selected (1)" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(targetRow).toHaveCount(0);
});

test("meeting minutes two-level navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301001");
  await page.getByLabel("Passcode").fill("faith830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("button", { name: "Meeting Minutes" }).click();
  await expect(page.getByRole("heading", { name: "Council Meeting Minutes" })).toBeVisible();

  await page.getByText("Council Business Meeting - April 2026").click();
  await expect(page.getByRole("heading", { name: "Council Business Meeting - April 2026" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to Meeting Minutes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to Members Area" })).toBeVisible();

  await page.getByRole("button", { name: "Back to Meeting Minutes" }).click();
  await expect(page.getByRole("heading", { name: "Council Meeting Minutes" })).toBeVisible();

  await page.getByRole("button", { name: "Back to Members Area" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
});

test("non-officer does not see Email Members or Download Members buttons", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301004");
  await page.getByLabel("Passcode").fill("hope830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("main").getByRole("button", { name: "Member List" }).click();
  await expect(page.getByRole("heading", { name: "Member List" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Email Members" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Download Members" })).not.toBeVisible();
});

test("officer sees Email Members and Download Members buttons", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("button", { name: "Member List" }).click();
  await expect(page.getByRole("button", { name: "Email Members" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download Members" })).toBeVisible();
});

test("form submissions show success modal and reset on dismiss", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301001");
  await page.getByLabel("Passcode").fill("faith830");
  await page.getByRole("button", { name: "Sign In" }).click();

  // Contact info save
  await page.getByRole("button", { name: "Contact Information" }).click();
  await expect(page.getByRole("heading", { name: "Contact Information" })).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await expect(page.getByText("Contact information updated.")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByRole("heading", { name: "Contact Information" })).toBeVisible();

  // Nomination send
  await page.getByRole("button", { name: "Back to Members Area" }).click();
  await page.getByRole("button", { name: "Knight and Family of the Month" }).click();
  await page.getByLabel("Knight of the Month").fill("John Smith");
  await page.getByLabel("Family of the Month").fill("Smith Family");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await expect(page.getByText("Nomination submitted to council officers.")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  // Fields cleared after dismiss
  await expect(page.getByLabel("Knight of the Month")).toHaveValue("");
});

test("non-officer does not see Calendar Updates entry in members area", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301004");
  await page.getByLabel("Passcode").fill("hope830");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("button", { name: "Calendar Updates" })).toHaveCount(0);
});

test("Add form stays open with values preserved when the backend returns an error", async ({ page }) => {
  // Intercept POST /events to simulate a backend error with a `detail` payload.
  await page.route("**/events", (route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Server is temporarily unavailable." }),
      });
    } else {
      route.continue();
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByRole("main").getByRole("button", { name: "Calendar Updates" }).click();

  await page.getByRole("button", { name: "Select day 13" }).click();
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Title").fill("Drafted Title");
  await page.getByLabel("Description").fill("Drafted body.");
  await page.getByRole("button", { name: "Save" }).click();

  // Backend error surfaces verbatim in the modal
  await expect(page.getByRole("heading", { name: "Error" })).toBeVisible();
  await expect(page.getByText("Server is temporarily unavailable.")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();

  // Form is still open, values preserved
  await expect(page.getByRole("heading", { name: "Add Event" })).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Drafted Title");
  await expect(page.getByLabel("Description")).toHaveValue("Drafted body.");
  await page.getByRole("button", { name: "Cancel" }).click();
});

test("officer Add/Edit/Delete reflects in the public Calendar view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("main").getByRole("button", { name: "Calendar Updates" }).click();
  await expect(page.getByRole("heading", { name: "Calendar Updates" })).toBeVisible();

  // Add — day 13 starts empty in seed
  await page.getByRole("button", { name: "Select day 13" }).click();
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: "Add Event" })).toBeVisible();
  await page.getByLabel("Title").fill("E2E Sync Event");
  await page.getByLabel("Description").fill("Created from the officer view.");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("E2E Sync Event")).toBeVisible();

  // Confirm it appears in the public Calendar
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Events Calendar" }).click();
  await expect(page.getByText("E2E Sync Event")).toBeVisible();

  // Back to Calendar Updates and edit
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Members Login" }).click();
  await page.getByRole("main").getByRole("button", { name: "Calendar Updates" }).click();
  await page.getByRole("button", { name: "Select day 13" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit Event" })).toBeVisible();
  await page.getByLabel("Title").fill("E2E Edited Event");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("E2E Edited Event")).toBeVisible();
  await expect(page.getByText("E2E Sync Event")).not.toBeVisible();

  // Confirm edit on public side
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Events Calendar" }).click();
  await expect(page.getByText("E2E Edited Event")).toBeVisible();

  // Back to Calendar Updates and delete
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Members Login" }).click();
  await page.getByRole("main").getByRole("button", { name: "Calendar Updates" }).click();
  await page.getByRole("button", { name: "Select day 13" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Will you confirm?")).toBeVisible();
  await page.getByRole("button", { name: "Yes" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("E2E Edited Event")).not.toBeVisible();

  // Confirm gone from public Calendar
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Events Calendar" }).click();
  await expect(page.getByText("E2E Edited Event")).not.toBeVisible();
});

test("officer sees Calendar Updates entry and can open the officer calendar view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Calendar Updates" }).click();
  await expect(page.getByRole("heading", { name: "Calendar Updates" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
});

test("non-officer does not see Edit Announcements entry in members area", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301004");
  await page.getByLabel("Passcode").fill("hope830");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("button", { name: "Edit Announcements" })).toHaveCount(0);
});

test("officer sees Edit Announcements entry and can open the announcements officer view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Edit Announcements" }).click();
  await expect(page.getByRole("heading", { name: "Edit Announcements" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
});

test("Add Announcement form stays open with values preserved when the backend returns an error", async ({ page }) => {
  // Intercept POST /announcements to simulate a backend error with a `detail` payload.
  await page.route("**/announcements", (route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Announcement service is temporarily unavailable." }),
      });
    } else {
      route.continue();
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByRole("main").getByRole("button", { name: "Edit Announcements" }).click();

  await page.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Title").fill("Drafted Title");
  await page.getByLabel("Announcement Details").fill("Drafted body.");
  await page.getByLabel("Date to Delete").fill("2026-12-31");
  await page.getByRole("button", { name: "Save" }).click();

  // Backend error message surfaces verbatim in the modal
  await expect(page.getByRole("heading", { name: "Error" })).toBeVisible();
  await expect(page.getByText("Announcement service is temporarily unavailable.")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();

  // Form is still open, values preserved
  await expect(page.getByRole("heading", { name: "Add Announcement" })).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Drafted Title");
  await expect(page.getByLabel("Announcement Details")).toHaveValue("Drafted body.");
  await expect(page.getByLabel("Date to Delete")).toHaveValue("2026-12-31");
  await page.getByRole("button", { name: "Cancel" }).click();
});

test("officer Add/Edit/Delete reflects in the public News view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.getByRole("main").getByRole("button", { name: "Edit Announcements" }).click();
  await expect(page.getByRole("heading", { name: "Edit Announcements" })).toBeVisible();

  // Add
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: "Add Announcement" })).toBeVisible();
  await page.getByLabel("Title").fill("E2E Sync Announcement");
  await page.getByLabel("Announcement Details").fill("Created from the officer view.");
  await page.getByLabel("Date to Delete").fill("2026-12-31");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("E2E Sync Announcement")).toBeVisible();

  // Confirm it appears in the public News view (sorted newest first, so it should be the first box)
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "News & Announcements" }).click();
  await expect(page.getByRole("button", { name: "E2E Sync Announcement" })).toBeVisible();

  // Back to officer view and edit
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Members Login" }).click();
  await page.getByRole("main").getByRole("button", { name: "Edit Announcements" }).click();
  await page.getByRole("button", { name: "Select announcement E2E Sync Announcement" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit Announcement", exact: true })).toBeVisible();
  await page.getByLabel("Title").fill("E2E Edited Announcement");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("E2E Edited Announcement")).toBeVisible();
  await expect(page.getByText("E2E Sync Announcement")).not.toBeVisible();

  // Confirm edit on public side
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "News & Announcements" }).click();
  await expect(page.getByRole("button", { name: "E2E Edited Announcement" })).toBeVisible();

  // Back to officer view and delete
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Members Login" }).click();
  await page.getByRole("main").getByRole("button", { name: "Edit Announcements" }).click();
  await page.getByRole("button", { name: "Select announcement E2E Edited Announcement" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { name: "Confirm the delete?" })).toBeVisible();
  const dialog = page.locator("div.fixed").filter({ hasText: "Confirm the delete?" });
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByText("E2E Edited Announcement")).not.toBeVisible();

  // Confirm gone from public News
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "News & Announcements" }).click();
  await expect(page.getByText("E2E Edited Announcement")).not.toBeVisible();
});

test("announcement with deleteDate=today is still visible in the public News view", async ({ page }) => {
  // Compute today in the browser's local time, formatted as YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const title = `E2E Today-Boundary ${Date.now()}`;

  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301002");
  await page.getByLabel("Passcode").fill("charity830");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByRole("main").getByRole("button", { name: "Edit Announcements" }).click();

  // Create an announcement that expires today
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Announcement Details").fill("Should be visible through today.");
  await page.getByLabel("Date to Delete").fill(todayStr);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();

  // Public view should still show it (visible through the delete date itself)
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "News & Announcements" }).click();
  await expect(page.getByRole("button", { name: title })).toBeVisible();

  // Clean up — delete the announcement we just created so the seed doesn't drift across runs
  await page.getByRole("navigation", { name: "Council navigation" }).getByRole("button", { name: "Members Login" }).click();
  await page.getByRole("main").getByRole("button", { name: "Edit Announcements" }).click();
  await page.getByRole("button", { name: `Select announcement ${title}` }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  const dialog = page.locator("div.fixed").filter({ hasText: "Confirm the delete?" });
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { name: "Success" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();
});

test("logout returns to login form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301001");
  await page.getByLabel("Passcode").fill("faith830");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Members Login" })).toBeVisible();
});
