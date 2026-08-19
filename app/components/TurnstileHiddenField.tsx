"use client";

import { useState } from "react";
import TurnstileWidget from "./TurnstileWidget";

/**
 * Für Formulare, die per natives <form action={serverAction}> arbeiten
 * (Progressive Enhancement, kein onSubmit-Handler) - anders als bei
 * Login/Registrierung/Passwort-vergessen (dort wird das Token direkt vor
 * dem handleAction()-Aufruf ans FormData gehängt). Hier übernimmt der
 * Browser das Sammeln aller benannten <input>-Felder im Formular von
 * selbst, inklusive dieses versteckten Feldes - kein zusätzlicher
 * JS-Submit-Handler nötig.
 */
export default function TurnstileHiddenField() {
  const [token, setToken] = useState("");
  return (
    <>
      <TurnstileWidget onVerify={setToken} />
      <input type="hidden" name="turnstileToken" value={token} />
    </>
  );
}
