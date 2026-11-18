export function BrandMark({ className = 'h-8 w-10' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 31L8 9L15 23L22 9L27 31" stroke="var(--color-brand-lime)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 31L26 9L33 23L40 9L45 31" stroke="var(--color-brand-green)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
