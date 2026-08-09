export function ProfileAvatar({
  name,
  avatarUrl,
  className = '',
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  const initials = name.trim().slice(0, 2).toUpperCase() || 'ZE';

  return (
    <div
      role='img'
      aria-label={name + ' profile picture'}
      className={'flex flex-shrink-0 items-center justify-center bg-cover bg-center font-black ' + className}
      style={avatarUrl ? { backgroundImage: 'url(' + avatarUrl + ')' } : undefined}
    >
      {!avatarUrl && initials}
    </div>
  );
}
