export type SportType = 'futbol' | 'baloncesto' | 'tenis' | 'todos';

export type OddsFormat = 'decimal' | 'american' | 'fractional';

export interface MatchOdds {
  home: number;
  draw?: number;
  away: number;
}

export interface OverUnderOdds {
  line: number;
  over: number;
  under: number;
}

export interface MatchPrediction {
  pick: string;
  market: string;
  probability: number; // 0 - 100
  fairOdds: number;
  marketOdds: number;
  expectedValue: string; // e.g. "+14.5%"
  confidence: number; // 0 - 100
  riskLevel: 'Bajo' | 'Medio' | 'Alto';
  exactScore: string;
  reasoning: string;
  keyTacticalFactors: string[];
}

export interface MatchItem {
  id: string;
  sport: 'futbol' | 'baloncesto' | 'tenis';
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeRank?: string;
  awayRank?: string;
  startTime: string; // ISO or readable
  isoDate?: string; // ISO 8601 string for exact phone timezone conversion
  dateCategory: 'hoy' | 'manana' | 'semana';
  status: 'upcoming' | 'live' | 'finished';
  liveMinute?: string;
  currentScore?: { home: number; away: number };
  odds: MatchOdds;
  overUnder?: OverUnderOdds;
  formHome: ('V' | 'E' | 'D')[];
  formAway: ('V' | 'E' | 'D')[];
  image?: string;
  prediction: MatchPrediction;
}

export interface BetSlipItem {
  id: string;
  matchId: string;
  matchTitle: string;
  selection: string;
  selectionType: 'home' | 'draw' | 'away' | 'custom';
  odds: number;
  sport: string;
  league: string;
}

export interface PlacedBet {
  id: string;
  date: string;
  type: 'simple' | 'combinada';
  items: BetSlipItem[];
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  status: 'pending' | 'won' | 'lost';
  pnl?: number;
}

export interface HistoricalTip {
  id: string;
  date: string;
  sport: 'futbol' | 'baloncesto' | 'tenis';
  match: string;
  league: string;
  market: string;
  pick: string;
  odds: number;
  stakeUnits: number;
  result: 'won' | 'lost';
  profitUnits: number;
  yieldPercent: number;
  verifiedBadge: boolean;
}

export interface PredictionSource {
  id: string;
  name: string;
  url: string;
  icon: string;
  type: 'algorithmic' | 'tactical' | 'community' | 'custom';
  enabled: boolean;
  reliabilityWeight: number; // 0.5 - 1.0
  description: string;
  custom?: boolean;
}

export interface SourcePredictionDetail {
  sourceId: string;
  sourceName: string;
  sourceIcon?: string;
  predictedWinner: 'HOME' | 'DRAW' | 'AWAY';
  exactScore: string;
  recommendedPick: string;
  confidencePct: number;
  arguments: string;
}

export interface ConsensusAnalysis {
  agreementScore: number; // 0 - 100%
  consensusWinner: string;
  homeVotes: number;
  drawVotes: number;
  awayVotes: number;
  sourcesCount: number;
  sourceDetails: SourcePredictionDetail[];
  synthesizedMetaPick: string;
  synthesizedOdds: number;
  expectedValue: string;
  discrepanciesNoted: string;
  metaSummary: string;
}

export interface MultipleLeg {
  matchId: string;
  matchTitle: string;
  league: string;
  sport: 'futbol' | 'baloncesto' | 'tenis';
  selection: string;
  odds: number;
  agreementRate: number; // 0-100%
  supportingApps: string[]; // e.g. ["FootyStats", "Sofascore", "BeSoccer", "ScoreGPT"]
  tacticalReason: string;
}

export interface MultiplePredictionPackage {
  id: string;
  title: string;
  badge: string;
  description: string;
  riskLevel: 'Bajo' | 'Medio' | 'Alto';
  legs: MultipleLeg[];
  totalOdds: number;
  confidenceScore: number;
  agreementLevel: string;
}

export interface AppSpecificPrediction {
  matchId: string;
  appId: string;
  appName: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: SportType;
  predictedWinner: 'HOME' | 'DRAW' | 'AWAY';
  recommendedPick: string;
  exactScore: string;
  confidencePct: number;
  marketOdds: number;
  fairOdds: number;
  probabilities: { home: number; draw: number; away: number };
  methodologyNote: string;
  keyTacticalFactor: string;
  isBanker: boolean;
  alternativePicks?: string[];
}


