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
