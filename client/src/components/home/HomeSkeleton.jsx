export default function HomeSkeleton({ reviews = false }) {
  return (
    <div className={reviews ? "rr-review-loading" : "rr-room-grid"} role="status"
      aria-label={reviews ? "กำลังโหลดรีวิว" : "กำลังโหลดห้องพัก"}>
      {[0, 1, 2].map(index => (
        <div className="rr-loading-card" key={index} aria-hidden="true">
          {!reviews && <div className="rr-room-image rr-placeholder" />}
          <div className="rr-loading-copy">
            {reviews && <span className="rr-loading-avatar rr-placeholder" />}
            <span className="rr-loading-title rr-placeholder" />
            <span className="rr-loading-line rr-placeholder" />
            <span className="rr-loading-line rr-placeholder" />
          </div>
        </div>
      ))}
    </div>
  );
}
