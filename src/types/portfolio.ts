export interface CelestialBody {
  id: number;
  name: string;
  short: string;
  role: string;
  badge: string;
  au: number;
  rx: number;
  ry: number;
  radius: number;
  color: string;
  glow: string;
  period: number;
  hasRing?: boolean;
  ringType?: 'saturn' | 'uranus' | 'earth';
  summary: string;
}

export interface SkillCategory {
  title: string;
  percentage: number;
  accentColor: string;
  skills: string[];
  description: string;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  year: string;
  status: 'ACTIVE' | 'VERIFIED';
  credentialId?: string;
  description: string;
  coreCompetencies: string[];
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location: string;
  period: string;
  metrics: string[];
  highlights: string[];
  tags: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  period: string;
  techStack: string[];
  category: 'Full-Stack' | 'Computer Vision / AI' | 'Network & Systems' | 'Cybersecurity Lab';
  highlights: string[];
  terminalPreview?: {
    command: string;
    output: string[];
  };
}

export interface EducationItem {
  degree: string;
  institution: string;
  period: string;
  grade: string;
  details: string;
  highlights?: string[];
}

export interface ResearchItem {
  title: string;
  role: string;
  accuracy: string;
  hardware: string;
  description: string;
  keyContributions: string[];
}

export interface ProjectedPlanetPosition {
  x: number;
  y: number;
  radius2D: number;
  distToCamera: number;
  zDepth?: number;
  worldZ?: number;
}
