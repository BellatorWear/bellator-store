"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordSetupModal from "./PasswordSetupModal";
import SetUsernameModal from "./SetUsernameModal";

/**
 * Globale Absicherung: läuft im Root-Layout auf JEDER Seite. Wenn ein
 * eingeloggter User noch kein Passwort gesetzt hat (mustSetPassword) oder
 * noch keinen Usernamen hat, wird ein nicht wegklickbares Overlay über die
 * GESAMTE Seite gelegt - unabhängig davon, über welchen Weg (Zugangsschlüssel,
 * Magic-Link, o.ä.) er gerade eingeloggt wurde. Die einzelnen Login-Seiten
 * (login/accesskey/verify) zeigen das Modal zusätzlich direkt nach dem
 * jeweiligen Login-Vorgang - dieser Guard hier ist das serverseitig
 * abgesicherte Netz, falls jemand diesen Zwischenschritt (z.B. durch
 * Neuladen der Seite mitten im Vorgang) umgehen würde.
 */
export default function ProfileSetupGuard({
  mustSetPassword,
  hasUsername,
  email,
}: {
  mustSetPassword: boolean;
  hasUsername: boolean;
  email: string;
}) {
  const [step, setStep] = useState<"password" | "username" | "done">(
    mustSetPassword ? "password" : !hasUsername ? "username" : "done",
  );
  const router = useRouter();

  if (step === "done") return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 font-mono">
      {step === "password" && (
        <PasswordSetupModal email={email} onDone={() => setStep("username")} />
      )}
      {step === "username" && (
        <SetUsernameModal
          onDone={() => {
            setStep("done");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
