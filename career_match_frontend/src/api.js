const API_BASE = "http://localhost:4567/api";

const get = (path) =>
  fetch(`${API_BASE}${path}`).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const getStudents  = () => get("/students");
export const getSkills    = () => get("/skills");
export const getInterests = () => get("/interests");
export const getCareers   = () => get("/careers");

/**
 * Fetch career_requirements for every career.
 * Your CareerController needs a GET /api/careers/:id/requirements route.
 * If it doesn't exist yet (404), we return [] and the matcher falls back
 * to keyword scoring automatically.
 */
export const getAllRequirements = async (careers) => {
  const results = [];
  for (const career of careers) {
    try {
      const reqs = await get(`/careers/${career.careerId}/requirements`);
      if (Array.isArray(reqs)) {
        reqs.forEach((r) => results.push({ ...r, careerId: career.careerId }));
      }
    } catch (_) {
      // endpoint not yet implemented — silently skip
    }
  }
  return results;
};

/**
 * Client-side scoring algorithm.
 *
 * Scoring rules:
 *   Skill match    → weight × 2 pts
 *   Interest match → weight × 1 pt
 *   Work-style bonus → +1 pt if career category/title matches style keyword
 *
 * If career_requirements table has data those links are used.
 * If the table is empty / endpoint missing we fall back to fuzzy
 * keyword matching between skill/interest names and career title+category.
 */
export const scoreAndRankCareers = (
  careers,
  requirements,
  allSkills,
  allInterests,
  selectedSkillIds,
  selectedInterestIds,
  workStyle
) => {
  // Build lookup maps
  const skillNameById    = Object.fromEntries(allSkills.map((s) => [s.skillId, s.skillName]));
  const interestNameById = Object.fromEntries(allInterests.map((i) => [i.interestId, i.interestName]));

  const styleKeywords = {
    software:   ["Software", "Developer", "Engineer", "Web", "Data", "Security", "Cloud"],
    "hands-on": ["Hardware", "Embedded", "Mechanical", "Electrical", "Manufacturing", "Technician"],
    research:   ["Research", "Scientist", "Analyst", "Data", "Science", "Academic"],
    leadership: ["Manager", "Lead", "Architect", "Director", "CTO", "Principal"],
  };

  // Build synthetic requirements if table is empty
  let reqs = requirements;
  if (reqs.length === 0) {
    reqs = [];
    careers.forEach((career) => {
      const haystack = `${career.title} ${career.category}`.toLowerCase();
      allSkills.forEach((skill) => {
        const needle = skill.skillName.toLowerCase();
        if (needle.length > 2 && haystack.includes(needle.slice(0, Math.min(needle.length, 6)))) {
          reqs.push({ careerId: career.careerId, skillId: skill.skillId, weight: 2 });
        }
      });
      allInterests.forEach((interest) => {
        const needle = interest.interestName.toLowerCase();
        if (needle.length > 2 && haystack.includes(needle.slice(0, Math.min(needle.length, 6)))) {
          reqs.push({ careerId: career.careerId, interestId: interest.interestId, weight: 1 });
        }
      });
    });
  }

  const ranked = careers
    .map((career) => {
      const careerReqs = reqs.filter((r) => r.careerId === career.careerId);
      let score = 0;
      const matchedSkillNames    = [];
      const matchedInterestNames = [];

      careerReqs.forEach((req) => {
        if (req.skillId && selectedSkillIds.includes(req.skillId)) {
          score += (req.weight ?? 1) * 2;
          const name = skillNameById[req.skillId];
          if (name && !matchedSkillNames.includes(name)) matchedSkillNames.push(name);
        }
        if (req.interestId && selectedInterestIds.includes(req.interestId)) {
          score += (req.weight ?? 1) * 1;
          const name = interestNameById[req.interestId];
          if (name && !matchedInterestNames.includes(name)) matchedInterestNames.push(name);
        }
      });

      // Work style bonus
      if (workStyle && styleKeywords[workStyle]) {
        const haystack = `${career.title} ${career.category}`;
        if (styleKeywords[workStyle].some((kw) => haystack.includes(kw))) {
          score += 1;
        }
      }

      return {
        ...career,
        score,
        matchedSkills:    matchedSkillNames,
        matchedInterests: matchedInterestNames,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked;
};