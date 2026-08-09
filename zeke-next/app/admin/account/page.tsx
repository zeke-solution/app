import { SignOutButton } from '@/components/auth/SignOutButton';
import { Card } from '@/components/ui/Card';

export default function AdminAccountPage() {
  return (
    <div className='mx-auto max-w-lg'>
      <h1 className='text-xl font-black text-light'>Admin account</h1>
      <p className='mb-5 mt-1 text-sm text-muted'>
        Session controls for this device.
      </p>
      <Card>
        <div className='mb-2 text-sm font-black text-light'>Sign out</div>
        <p className='mb-3 text-xs leading-5 text-muted'>
          End the current admin session safely.
        </p>
        <SignOutButton fullWidth />
      </Card>
    </div>
  );
}
