// PDF-komponent for samlet rapport + artikel-kort (server-side rendered via @react-pdf/renderer)
// Brand: EMILS AI NEWS — accent orange #FF3700

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

interface UnifiedContent {
  theme: string
  context: string
  insights: string[]
  trends: string
  sources: string
}

interface DigestArticle {
  title: string
  source: string
  url?: string | null
  summary: string
  takeaways: string[]
}

interface Props {
  unified: UnifiedContent
  articles: DigestArticle[]
  week: number
  year: number
  generatedAt: string
}

const COLOR_ORANGE = '#FF3700'
const COLOR_OFFBLACK = '#1A1A1A'
const COLOR_GUNMETAL = '#484848'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingBottom: 60,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: COLOR_OFFBLACK,
    lineHeight: 1.5,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 30,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  brand: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLOR_OFFBLACK,
    letterSpacing: 1,
  },
  brandAccent: {
    color: COLOR_ORANGE,
  },
  weekLabel: {
    fontSize: 10,
    color: COLOR_GUNMETAL,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
  },

  // Theme
  theme: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLOR_OFFBLACK,
    lineHeight: 1.25,
    marginBottom: 18,
  },
  context: {
    fontSize: 11,
    color: COLOR_OFFBLACK,
    lineHeight: 1.65,
    marginBottom: 28,
  },

  // Section title (eyebrow)
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLOR_ORANGE,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Insights — VIEW + TEXT mønster så tallet centreres korrekt
  insightsBlock: {
    marginBottom: 22,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLOR_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  insightNumber: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  insightText: {
    flex: 1,
    fontSize: 11,
    color: COLOR_OFFBLACK,
    lineHeight: 1.55,
  },

  // Trends
  trendsBox: {
    backgroundColor: '#FFF5F2',
    borderLeftWidth: 2,
    borderLeftColor: COLOR_ORANGE,
    padding: 14,
    marginBottom: 18,
  },
  trendsText: {
    fontSize: 11,
    color: COLOR_OFFBLACK,
    lineHeight: 1.55,
  },

  // Sources
  sources: {
    fontSize: 9,
    color: COLOR_GUNMETAL,
    fontStyle: 'italic',
    marginTop: 14,
  },

  // Article cards (page 2+)
  articlesPageTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLOR_OFFBLACK,
    marginBottom: 24,
  },
  articleCard: {
    marginBottom: 22,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  articleMeta: {
    fontSize: 9,
    color: COLOR_ORANGE,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  articleTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLOR_OFFBLACK,
    lineHeight: 1.3,
    marginBottom: 10,
  },
  articleSummary: {
    fontSize: 10.5,
    color: COLOR_OFFBLACK,
    lineHeight: 1.55,
    marginBottom: 12,
  },
  takeawaysBox: {
    backgroundColor: '#FFF5F2',
    borderLeftWidth: 2,
    borderLeftColor: COLOR_ORANGE,
    padding: 12,
  },
  takeawaysLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLOR_ORANGE,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  takeawayItem: {
    fontSize: 10,
    color: COLOR_OFFBLACK,
    lineHeight: 1.5,
    marginBottom: 3,
    paddingLeft: 8,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    fontSize: 8,
    color: COLOR_GUNMETAL,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export function UnifiedReportPDF({ unified, articles, week, year, generatedAt }: Props) {
  const dateStr = new Date(generatedAt).toLocaleDateString('da-DK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Genbrugelig header (samme på alle sider)
  const Header = () => (
    <View style={styles.header} fixed>
      <Text style={styles.brand}>
        EMILS <Text style={styles.brandAccent}>AI</Text> NEWS
      </Text>
      <Text style={styles.weekLabel}>Uge {week}, {year}</Text>
    </View>
  )

  // Genbrugelig footer
  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text>spring-marketing-news.vercel.app</Text>
      <Text>Genereret {dateStr}</Text>
    </View>
  )

  return (
    <Document>

      {/* PAGE 1 — Samlet rapport */}
      <Page size="A4" style={styles.page}>
        <Header />

        <Text style={styles.theme}>{unified.theme}</Text>

        {unified.context ? (
          <Text style={styles.context}>{unified.context}</Text>
        ) : null}

        {unified.insights.length > 0 && (
          <View style={styles.insightsBlock}>
            <Text style={styles.sectionTitle}>Hovedindsigter</Text>
            {unified.insights.map((insight, i) => (
              <View key={i} style={styles.insightRow} wrap={false}>
                <View style={styles.insightCircle}>
                  <Text style={styles.insightNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {unified.trends ? (
          <View style={styles.trendsBox} wrap={false}>
            <Text style={styles.sectionTitle}>Tendenser</Text>
            <Text style={styles.trendsText}>{unified.trends}</Text>
          </View>
        ) : null}

        {unified.sources ? (
          <Text style={styles.sources}>Kilder: {unified.sources}</Text>
        ) : null}

        <Footer />
      </Page>

      {/* PAGE 2+ — Artikel-kort */}
      {articles.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Header />

          <Text style={styles.articlesPageTitle}>Valgte artikler</Text>

          {articles.map((art, i) => (
            <View key={i} style={styles.articleCard} wrap={false}>
              <Text style={styles.articleMeta}>
                — {String(i + 1).padStart(2, '0')} · {art.source}
              </Text>
              <Text style={styles.articleTitle}>{art.title}</Text>
              {art.summary ? (
                <Text style={styles.articleSummary}>{art.summary}</Text>
              ) : null}
              {art.takeaways.length > 0 && (
                <View style={styles.takeawaysBox}>
                  <Text style={styles.takeawaysLabel}>Hovedpointer</Text>
                  {art.takeaways.map((t, j) => (
                    <Text key={j} style={styles.takeawayItem}>• {t}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          <Footer />
        </Page>
      )}

    </Document>
  )
}
