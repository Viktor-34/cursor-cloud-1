export function SectionPage({ title }: { title: string }) {
  return (
    <div className="page">
      <header className="ph">
        <div>
          <h1>{title}</h1>
          <p>This section is next. Navigation and the workspace shell are already in place.</p>
        </div>
      </header>
    </div>
  );
}
