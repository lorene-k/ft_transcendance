import { setContent } from "../utils/layout.ts";

export async function renderAccount() {
  await setContent("account.html", true);
  const accountLink = document.getElementById("account-link");
  if (accountLink)
    accountLink.classList.add("current-page")
}
