interface Violation {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  description: string
  [key: string]: any
}

export class RiskScoringAI {
  private weights = {
    'TAB_SWITCH': 15,
    'WINDOW_BLUR': 12,
    'MULTIPLE_FACES': 30,
    'NO_FACE': 10,
    'LOOKING_AWAY': 5,
    'UNAUTHORIZED_OBJECT': 25,
    'MULTIPLE_PEOPLE': 35,
    'COPY_PASTE': 20,
    'RIGHT_CLICK': 8,
    'FULLSCREEN_EXIT': 18
  }

  private severityMultipliers = {
    'low': 0.5,
    'medium': 1.0,
    'high': 1.5,
    'critical': 2.0
  }

  calculateRiskScore(violations: Violation[], examDuration: number) {
    if (violations.length === 0) {
      return {
        riskScore: 0,
        riskLevel: 'LOW',
        recommendation: 'PASS',
        analysis: 'No violations detected. Clean exam session.'
      }
    }

    // Filter false positives
    const genuineViolations = this.filterFalsePositives(violations)

    // Calculate weighted score
    let totalScore = 0
    const violationSummary: Record<string, number> = {}

    genuineViolations.forEach(violation => {
      const baseWeight = this.weights[violation.type as keyof typeof this.weights] || 5
      const severityMultiplier = this.severityMultipliers[violation.severity]
      const score = baseWeight * severityMultiplier

      totalScore += score
      violationSummary[violation.type] = (violationSummary[violation.type] || 0) + 1
    })

    // Normalize to 0-100 scale
    const normalizedScore = Math.min(100, (totalScore / Math.max(examDuration / 60, 1)) * 2)

    return {
      riskScore: Math.round(normalizedScore),
      riskLevel: this.getRiskLevel(normalizedScore),
      recommendation: this.getRecommendation(normalizedScore),
      totalViolations: violations.length,
      genuineViolations: genuineViolations.length,
      violationSummary,
      analysis: this.generateAnalysis(genuineViolations, normalizedScore)
    }
  }

  private filterFalsePositives(violations: Violation[]): Violation[] {
    const filtered: Violation[] = []
    const violationTimestamps: Record<string, number[]> = {}

    violations.forEach(v => {
      const timestamp = new Date(v.timestamp).getTime()
      
      if (!violationTimestamps[v.type]) {
        violationTimestamps[v.type] = []
      }
      violationTimestamps[v.type].push(timestamp)
    })

    // Filter out brief violations (< 2 seconds)
    violations.forEach(v => {
      const type = v.type
      const timestamps = violationTimestamps[type]
      
      if (type === 'NO_FACE' || type === 'LOOKING_AWAY') {
        // Only flag if sustained for > 2 seconds
        const currentTime = new Date(v.timestamp).getTime()
        const recentViolations = timestamps.filter(t => 
          Math.abs(t - currentTime) < 2000
        )
        
        if (recentViolations.length >= 2) {
          filtered.push(v)
        }
      } else {
        // Critical violations always count
        filtered.push(v)
      }
    })

    return filtered
  }

  private getRiskLevel(score: number): string {
    if (score < 20) return 'LOW'
    if (score < 40) return 'MEDIUM'
    if (score < 70) return 'HIGH'
    return 'CRITICAL'
  }

  private getRecommendation(score: number): string {
    if (score < 20) return 'PASS'
    if (score < 50) return 'REVIEW'
    return 'FAIL'
  }

  private generateAnalysis(violations: Violation[], score: number): string {
    if (violations.length === 0) {
      return 'Excellent exam conduct. No suspicious behavior detected.'
    }

    const criticalCount = violations.filter(v => v.severity === 'critical').length
    const highCount = violations.filter(v => v.severity === 'high').length

    if (criticalCount > 0) {
      return `Critical violations detected (${criticalCount}). Immediate review required.`
    }

    if (highCount > 3) {
      return `Multiple high-severity violations (${highCount}). Manual review recommended.`
    }

    if (score < 30) {
      return 'Minor violations detected. Likely honest mistakes or environmental factors.'
    }

    return 'Moderate risk detected. Review flagged incidents for context.'
  }

  generateInsights(violations: Violation[]) {
    const typeCount: Record<string, number> = {}
    
    violations.forEach(v => {
      typeCount[v.type] = (typeCount[v.type] || 0) + 1
    })

    const insights = []

    if (typeCount['TAB_SWITCH'] > 5) {
      insights.push('⚠️ Frequent tab switching detected - possible external resource access')
    }

    if (typeCount['MULTIPLE_FACES'] > 0) {
      insights.push('🚨 Multiple people detected - potential impersonation')
    }

    if (typeCount['UNAUTHORIZED_OBJECT'] > 0) {
      insights.push('📱 Unauthorized devices detected in frame')
    }

    if (typeCount['LOOKING_AWAY'] > 10) {
      insights.push('👀 Excessive looking away - possible secondary screen usage')
    }

    return insights
  }
}

export const riskScoringAI = new RiskScoringAI()
