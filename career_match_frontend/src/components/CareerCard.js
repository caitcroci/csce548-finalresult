function CareerCard({ career, rank }) {
  return (
    <div className={`career-card ${rank === 1 ? "rank-1" : ""}`}>
      <div className="rank-box">#{rank}</div>

      <div>
        <div className="career-title">{career.title}</div>
        <span className="career-cat">{career.category}</span>
        {career.description && (
          <p className="career-desc">{career.description}</p>
        )}
        <div className="match-tags">
          {career.matchedSkills?.map((s) => (
            <span key={s} className="tag tag-skill">✦ {s}</span>
          ))}
          {career.matchedInterests?.map((i) => (
            <span key={i} className="tag tag-interest">◆ {i}</span>
          ))}
          {!career.matchedSkills?.length && !career.matchedInterests?.length && (
            <span className="tag tag-skill">✦ Category match</span>
          )}
        </div>
      </div>

      <div className="score-box">
        <div className="score-num">{career.score}</div>
        <div className="score-label">pts</div>
      </div>
    </div>
  );
}

export default CareerCard;