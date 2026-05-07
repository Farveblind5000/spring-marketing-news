// PDF-komponent for samlet rapport (server-side rendered via @react-pdf/renderer)
// Brand: Spring CC orange #FF3700, offblack #1A1A1A, gunmetal #484848

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

interface UnifiedContent {
  theme: string
  context: string
  insights: string[]
  trends: string
  sources: string
}

interface Props {
  unified: UnifiedContent
  week: number
  year: number
  generatedAt: string
}

// Styles — brand-tokens fra globals.css
const COLOR_ORANGE = '#FF3700'
const COLOR_OFFBLACK = '#1A1A1A'
const COLOR_GUNMETAL = '#484848'

const styles = StyleSheet.create({
  page: {
    padding: 50,
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
  },
  brandAccent: {
    color: COLOR_ORANGE,
  },
  brandSub: {
    fontSize: 9,
    color: COLOR_GUNMETAL,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  weekLabel: {
    fontSize: 10,
    color: COLOR_GUNMETAL,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
  },

  // Theme (titel)
  theme: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLOR_OFFBLACK,
    lineHeight: 1.25,
    marginBottom: 18,
  },

  // Context paragraph
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

  // Insights
  insightsBlock: {
    marginBottom: 22,
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  insightNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLOR_ORANGE,
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingTop: 3,
    marginRight: 10,
    marginTop: 1,
  },
  insightText: {
    flex: 1,
    fontSize: 11,
    color: COLOR_OFFBLACK,
    lineHeight: 1.55,
  },

  // Trends box
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

export function UnifiedReportPDF({ unified, week, year, generatedAt }: Props) {
  const dateStr = new Date(generatedAt).toLocaleDateString('da-DK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              Spring<Text style={styles.brandAccent}>CC</Text>
            </Text>
            <Text style={styles.brandSub}>News Intel</Text>
          </View>
          <Text style={styles.weekLabel}>Uge {week}, {year}</Text>
        </View>

        {/* THEME */}
        <Text style={styles.theme}>{unified.theme}</Text>

        {/* CONTEXT */}
        {unified.context ? (
          <Text style={styles.context}>{unified.context}</Text>
        ) : null}

        {/* INSIGHTS */}
        {unified.insights.length > 0 && (
          <View style={styles.insightsBlock}>
            <Text style={styles.sectionTitle}>Hovedindsigter</Text>
            {unified.insights.map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <Text style={styles.insightNumber}>{i + 1}</Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TRENDS */}
        {unified.trends ? (
          <View style={styles.trendsBox}>
            <Text style={styles.sectionTitle}>Tendenser</Text>
            <Text style={styles.trendsText}>{unified.trends}</Text>
          </View>
        ) : null}

        {/* SOURCES */}
        {unified.sources ? (
          <Text style={styles.sources}>Kilder: {unified.sources}</Text>
        ) : null}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text>spring-marketing-news.vercel.app</Text>
          <Text>Genereret {dateStr}</Text>
        </View>

      </Page>
    </Document>
  )
}
