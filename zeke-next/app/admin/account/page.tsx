import { SignOutButton } from '@/components/auth/SignOutButton';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';

export default function AdminAccountPage() {
  return (
    <div className='mx-auto max-w-lg'>
      <PageHeader title='Admin account' description='Session controls for this device.' />
      <Card>
        <div className='mb-2 text-sm font-semibold text-light'>Sign out</div>
        <p className='mb-3 text-xs leading-5 text-muted'>
          End the current admin session safely.
        </p>
        <SignOutButton fullWidth />
      </Card>
    </div>
  );
}
