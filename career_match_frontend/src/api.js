const API_BASE = "/api";

const get = (path) =>
  fetch(`${API_BASE}${path}`).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const getStudents  = () => get("/students");
export const getSkills    = () => get("/skills");
export const getInterests = () => get("/interests");
export const getCareers   = () => get("/careers");

export const createStudent = (name) =>
  fetch(`${API_BASE}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const createSkill = (skillName) =>
  fetch(`${API_BASE}/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skillName }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const updateSkill = (id, skillName) =>
  fetch(`${API_BASE}/skills/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skillName }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const createInterest = (interestName) =>
  fetch(`${API_BASE}/interests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interestName }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const updateInterest = (id, interestName) =>
  fetch(`${API_BASE}/interests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interestName }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const createCareer = (title, category, description) =>
  fetch(`${API_BASE}/careers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, category, description }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const updateCareer = (id, title, category, description) =>
  fetch(`${API_BASE}/careers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, category, description }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const deleteCareer = (id) =>
  fetch(`${API_BASE}/careers/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  }).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export const getAllRequirements = async (careers) => {
  const results = [];
  for (const career of careers) {
    try {
      const reqs = await get(`/careers/${career.careerId}/requirements`);
      if (Array.isArray(reqs)) {
        reqs.forEach((r) => results.push({ ...r, careerId: career.careerId }));
      }
    } catch (_) {}
  }
  return results;
};

export const scoreAndRankCareers = (
  careers, requirements, allSkills, allInterests,
  selectedSkillIds, selectedInterestIds, workStyle
) => {
  const skillNameById    = Object.fromEntries(allSkills.map((s) => [s.skillId, s.skillName]));
  const interestNameById = Object.fromEntries(allInterests.map((i) => [i.interestId, i.interestName]));

  const styleKeywords = {
    software:   ["Software", "Developer", "Engineer", "Web", "Data", "Security", "Cloud"],
    "hands-on": ["Hardware", "Embedded", "Mechanical", "Electrical", "Manufacturing", "Technician"],
    research:   ["Research", "Scientist", "Analyst", "Data", "Science", "Academic"],
    leadership: ["Manager", "Lead", "Architect", "Director", "CTO", "Principal"],
  };

  let reqs = requirements;
  if (reqs.length === 0) {
    reqs = [];
    careers.forEach((career) => {
      const haystack = `${career.title} ${career.category}`.toLowerCase();
      allSkills.forEach((skill) => {
        const needle = skill.skillName.toLowerCase();
        if (needle.length > 2 && haystack.includes(needle.slice(0, Math.min(needle.length, 6))))
          reqs.push({ careerId: career.careerId, skillId: skill.skillId, weight: 2 });
      });
      allInterests.forEach((interest) => {
        const needle = interest.interestName.toLowerCase();
        if (needle.length > 2 && haystack.includes(needle.slice(0, Math.min(needle.length, 6))))
          reqs.push({ careerId: career.careerId, interestId: interest.interestId, weight: 1 });
      });
    });
  }

  return careers
    .map((career) => {
      const careerReqs = reqs.filter((r) => r.careerId === career.careerId);
      let score = 0;
      const matchedSkillNames = [], matchedInterestNames = [];

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

      if (workStyle && styleKeywords[workStyle]) {
        const haystack = `${career.title} ${career.category}`;
        if (styleKeywords[workStyle].some((kw) => haystack.includes(kw))) score += 1;
      }

      return { ...career, score, matchedSkills: matchedSkillNames, matchedInterests: matchedInterestNames };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
};