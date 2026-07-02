const App = () => {
  return (
    <main style={{ fontFamily: 'Inter, sans-serif', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Job Application Tracker</h1>
      <p>
        A self-hostable workspace for tracking applications, notes, reminders, and interviews.
      </p>
      <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '1rem' }}>
          <h2>Planned MVP</h2>
          <ul>
            <li>Dashboard with pipeline summary</li>
            <li>Applications list and detail view</li>
            <li>Notes, reminders, and interviews</li>
            <li>Settings and export basics</li>
          </ul>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '1rem' }}>
          <h2>Current status</h2>
          <p>The repository is now scaffolded with a frontend and backend starter.</p>
        </div>
      </section>
    </main>
  );
};

export default App;
