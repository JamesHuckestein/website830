import { expect, test } from "@playwright/test";

test("default home, section navigation, and member login flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Council 830 Leadership" })).toBeVisible();

  await page.getByRole("button", { name: "News & Announcements" }).click();
  await expect(
    page.getByRole("heading", { name: "News & Announcements" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Members Login" }).click();
  await page.getByLabel("Membership Number").fill("8301001");
  await page.getByLabel("Passcode").fill("faith830");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("heading", { name: "Members Area" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});
