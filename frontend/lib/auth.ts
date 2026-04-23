const demoMembers: Record<string, string> = {
  "8301001": "faith830",
  "8301002": "charity830",
};

export function authenticateMember(
  membershipNumber: string,
  passcode: string,
): boolean {
  return demoMembers[membershipNumber] === passcode;
}
