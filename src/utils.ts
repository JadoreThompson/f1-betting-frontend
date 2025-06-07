import { UtilsManager } from "./classes/UtilsManager";

export async function handleAuthFormSubmit(
  e: React.FormEvent<HTMLFormElement>,
  authType: "login" | "register"
): Promise<void> {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  console.log(body);

  try {
    const rsp = await fetch(UtilsManager.BASE_URL + `/auth/${authType}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!rsp.ok) {
      throw new Error(`Failed to ${authType}");`);
    }
  } catch (error) {
    console.error(`Error during ${authType}:`, error);
  }
}
