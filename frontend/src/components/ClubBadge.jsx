export default function ClubBadge({ clubName, userHasClub }) {
  if (!clubName) return null
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: userHasClub ? 'var(--green-light)' : 'var(--orange-light)',
      color: userHasClub ? 'var(--green-dark)' : 'var(--orange)',
      border: `1px solid ${userHasClub ? '#bbf7d0' : '#fed7aa'}`,
    }}>
      {userHasClub ? '✓' : '+'} {clubName}
    </span>
  )
}
