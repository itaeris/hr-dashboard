"use client";

import {
  EMAIL_SENDS_EVENT,
  loadCompanyEmailSends,
  type EmailSend,
} from "./email-sends";
import type { CompanySlug } from "./types";
import { useEffect, useState } from "react";

export function useEmailSends(slug: CompanySlug) {
  const [sends, setSends] = useState<EmailSend[]>([]);

  useEffect(() => {
    let live = true;

    function refresh() {
      void loadCompanyEmailSends(slug).then((rows) => {
        if (live) setSends(rows);
      });
    }

    refresh();
    window.addEventListener(EMAIL_SENDS_EVENT, refresh);
    return () => {
      live = false;
      window.removeEventListener(EMAIL_SENDS_EVENT, refresh);
    };
  }, [slug]);

  return sends;
}
