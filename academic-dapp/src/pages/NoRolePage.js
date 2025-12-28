import "./Page.css";

function NoRolePage() {
  return (
    <div className="center">
      <div className="center-card">
        <h2>No Role Assigned</h2>
        <p>Your account does not have an assigned role in the system.</p>
        <p className="text-muted">Please contact the administrator to request access.</p>
      </div>
    </div>
  );
}

export default NoRolePage;