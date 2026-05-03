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
  await expect(page.getByText("Test prayer intention.")).toBeVisible();

  await page.getByRole("button", { name: "Back to Members Area" }).click();
  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
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
