import { dummyMembers } from "@/data/siteData";

const demoPasscodes: Record<string, string> = {
  "8301001": "faith830",
  "8301002": "charity830",
  "8301004": "hope830",
};

export type AuthResult = {
  success: boolean;
  officerPosition: string | null;
};

export function authenticateMember(
  membershipNumber: string,
  passcode: string,
): AuthResult {
  if (demoPasscodes[membershipNumber] !== passcode) {
    return { success: false, officerPosition: null };
  }
  const member = dummyMembers.find((m) => m.memberNumber === membershipNumber);
  return { success: true, officerPosition: member?.officerPosition ?? null };
}
