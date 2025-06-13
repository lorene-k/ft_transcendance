import { setContent } from "../utils/layout.ts";

export async function renderAccount(push = true) {
  await setContent("account.html", push);
  const accountLink = document.getElementById("account-link");
  if (accountLink)
    accountLink.classList.add("current-page")
}
