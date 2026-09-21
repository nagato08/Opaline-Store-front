'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/data/account';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await logout();
        router.push('/');
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors duration-150 hover:text-danger disabled:pointer-events-none disabled:opacity-50"
    >
      <LogOut aria-hidden className="size-4" />
      Se déconnecter
    </button>
  );
}
