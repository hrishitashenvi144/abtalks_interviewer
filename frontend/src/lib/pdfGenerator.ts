import { jsPDF } from "jspdf";
import type { Candidate, Feedback } from "../types";

export function generateFeedbackPDF(candidate: Candidate, feedback: Feedback): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const score =
    feedback.overallScore ??
    Math.max(40, Math.min(96, 56 + (feedback.strengths.length - feedback.gaps.length) * 8));
  const rating = score >= 80 ? "Strong" : score >= 60 ? "Balanced" : "Needs Improvement";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkNewPage(heightNeeded: number) {
    if (y + heightNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header Banner Background
  doc.setFillColor(16, 21, 36);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Accent Line
  doc.setFillColor(245, 165, 36);
  doc.rect(0, 39, pageWidth, 1, "F");

  // Title in Header
  doc.setTextColor(245, 165, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ABTALKS INTERVIEW STUDIO", margin, 16);

  doc.setTextColor(232, 237, 248);
  doc.setFontSize(18);
  doc.text("Candidate Feedback Report", margin, 27);

  // Subtitle date right aligned
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(155, 172, 204);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(dateStr, pageWidth - margin, 27, { align: "right" });

  y = 52;

  // Candidate Overview Card
  doc.setFillColor(22, 30, 52);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, "F");

  // Left: Name & Role
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(232, 237, 248);
  doc.text(candidate.member.name, margin + 8, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(155, 172, 204);
  doc.text(
    `${candidate.member.jobRole} • ${candidate.member.yearsExperience} yrs experience`,
    margin + 8,
    y + 22
  );

  // Right: Overall Score Badge
  const scoreBoxWidth = 48;
  const scoreBoxX = pageWidth - margin - 8 - scoreBoxWidth;
  doc.setFillColor(31, 41, 69);
  doc.roundedRect(scoreBoxX, y + 5, scoreBoxWidth, 22, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(245, 165, 36);
  doc.text(`${score}% Score`, scoreBoxX + scoreBoxWidth / 2, y + 13, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(93, 215, 181);
  doc.text(`Rating: ${rating}`, scoreBoxX + scoreBoxWidth / 2, y + 20, { align: "center" });

  y += 42;

  // Section: Summary
  checkNewPage(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(245, 165, 36);
  doc.text("EXECUTIVE SUMMARY", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(232, 237, 248);
  const summaryLines = doc.splitTextToSize(feedback.summary || "No summary provided.", contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 8;

  // Section: Competency Breakdown
  const competencies = [
    { label: "Technical Understanding", val: feedback.technicalUnderstanding },
    { label: "Reasoning", val: feedback.reasoning },
    { label: "Communication", val: feedback.communication },
    { label: "Depth", val: feedback.depth },
  ].filter((c) => Boolean(c.val));

  if (competencies.length > 0) {
    checkNewPage(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(245, 165, 36);
    doc.text("COMPETENCY BREAKDOWN", margin, y);
    y += 8;

    competencies.forEach((comp) => {
      checkNewPage(18);
      doc.setFillColor(22, 30, 52);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(245, 165, 36);
      doc.text(comp.label, margin + 6, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(232, 237, 248);
      doc.text(comp.val!, margin + 65, y + 9);
      y += 18;
    });
    y += 4;
  }

  // Helper for Bullet Point List Sections
  function renderListSection(title: string, items: string[], titleColorRGB: [number, number, number]) {
    if (!items || items.length === 0) return;
    checkNewPage(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(titleColorRGB[0], titleColorRGB[1], titleColorRGB[2]);
    doc.text(title, margin, y);
    y += 7;

    items.forEach((item) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(232, 237, 248);
      const lines = doc.splitTextToSize(`•  ${item}`, contentWidth - 5);
      checkNewPage(lines.length * 5 + 3);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 3;
    });
    y += 6;
  }

  // Strengths
  renderListSection("KEY STRENGTHS", feedback.strengths, [93, 215, 181]);

  // Gaps / Weaknesses
  renderListSection("AREAS FOR GROWTH & GAPS", feedback.gaps, [242, 123, 108]);

  // Recommendations
  renderListSection("RECOMMENDATIONS", feedback.next, [245, 165, 36]);

  // Curriculum Revisit
  if (feedback.curriculumRevisit && feedback.curriculumRevisit.length > 0) {
    renderListSection("CURRICULUM AREAS TO REVISIT", feedback.curriculumRevisit, [155, 172, 204]);
  }

  // Add Page Numbers Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(155, 172, 204);
    doc.text(
      `ABTalks AI Interview Studio • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  const filename = `${candidate.member.name.replace(/[^a-zA-Z0-9]/g, "_")}_Feedback_Report.pdf`;
  doc.save(filename);
}
