import { useMemo, useState } from "react";
import projects from "../data/communityProjects.json";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function Community() {
  const [search, setSearch] = useState("");
  const [focusFilter, setFocusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const focusOptions = ["all", ...new Set(projects.map((p) => p.focusArea))];
  const cityOptions = ["all", ...new Set(projects.map((p) => p.city))];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.narrative.toLowerCase().includes(search.toLowerCase());
      const matchesFocus =
        focusFilter === "all" || project.focusArea === focusFilter;
      const matchesCity = cityFilter === "all" || project.city === cityFilter;
      return matchesSearch && matchesFocus && matchesCity;
    });
  }, [search, focusFilter, cityFilter]);

  const stats = useMemo(() => {
    const totalBudget = filteredProjects.reduce(
      (sum, project) => sum + project.budget,
      0
    );
    const avgImpact =
      filteredProjects.reduce((sum, project) => sum + project.impactScore, 0) /
      (filteredProjects.length || 1);

    return {
      totalBudget,
      avgImpact: Math.round(avgImpact),
      activeCount: filteredProjects.filter((p) => p.status === "active").length,
    };
  }, [filteredProjects]);

  return (
    <div className="community-page">
      <section className="page-card intro-card">
        <div>
          <p className="eyebrow">Community Story</p>
          <h2>Live funding stories in one feed.</h2>
          <p>Search, filter, and pull lines straight into your pitch.</p>
        </div>
        <div className="quick-stats">
          <article>
            <small>Total Budget</small>
            <strong>{formatCurrency(stats.totalBudget)}</strong>
          </article>
          <article>
            <small>Avg. Impact Score</small>
            <strong>{stats.avgImpact}%</strong>
          </article>
          <article>
            <small>Active Programs</small>
            <strong>{stats.activeCount}</strong>
          </article>
        </div>
      </section>

      <section className="page-card filter-panel">
        <div>
          <label htmlFor="searchProjects">Search story</label>
          <input
            id="searchProjects"
            type="search"
            placeholder="Search title or narration"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="focusFilter">Focus area</label>
          <select
            id="focusFilter"
            value={focusFilter}
            onChange={(e) => setFocusFilter(e.target.value)}
          >
            {focusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All areas" : option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cityFilter">City</label>
          <select
            id="cityFilter"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            {cityOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All cities" : option}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => {
            setSearch("");
            setFocusFilter("all");
            setCityFilter("all");
          }}
        >
          Clear filters
        </button>
      </section>

      <section className="project-grid">
        {filteredProjects.length === 0 ? (
          <div className="page-card empty-state">
            <p>No project matches your filters yet. Try broadening the search.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <article key={project.id} className="page-card project-card">
              <div className="project-card__header">
                <h3>{project.title}</h3>
                <span className={`status-pill status-${project.status}`}>
                  {project.status}
                </span>
              </div>
              <p className="project-narrative">{project.narrative}</p>
              <dl className="project-meta">
                <div>
                  <dt>City</dt>
                  <dd>{project.city}</dd>
                </div>
                <div>
                  <dt>Focus</dt>
                  <dd>{project.focusArea}</dd>
                </div>
                <div>
                  <dt>Budget</dt>
                  <dd>{formatCurrency(project.budget)}</dd>
                </div>
                <div>
                  <dt>Impact Score</dt>
                  <dd>{project.impactScore}%</dd>
                </div>
              </dl>
              <div className="tag-row">
                {project.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </section>

    </div>
  );
}
