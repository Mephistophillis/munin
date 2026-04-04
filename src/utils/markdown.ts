export function extractSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const regex = /^##\s+(.*)$/gm;
  
  let match;
  let lastIndex = 0;
  let currentHeading = "";

  while ((match = regex.exec(content)) !== null) {
    if (currentHeading) {
      const sectionContent = content.substring(lastIndex, match.index);
      sections.set(currentHeading, sectionContent);
    } else if (match.index > 0) {
      // content before the first heading
      const intro = content.substring(0, match.index);
      if (intro.trim()) {
         sections.set("", intro);
      }
    }
    currentHeading = match[1].trim();
    lastIndex = match.index;
  }

  if (currentHeading) {
    sections.set(currentHeading, content.substring(lastIndex));
  }

  return sections;
}

export function findSection(content: string, heading: string): string | null {
  const sections = extractSections(content);
  return sections.get(heading) || null;
}

export function replaceSection(content: string, heading: string, newContent: string): string {
  const sectionContent = findSection(content, heading);
  if (sectionContent === null) {
    return createSection(heading, newContent) + "\n\n" + content;
  }
  return content.replace(sectionContent, `## ${heading}\n\n${newContent}\n`);
}

export function appendToSection(content: string, heading: string, appendContent: string): string {
  const sectionContent = findSection(content, heading);
  if (sectionContent === null) {
     return content + "\n\n" + createSection(heading, appendContent);
  }
  
  const updatedSection = sectionContent.trimRight() + "\n" + appendContent + "\n";
  return content.replace(sectionContent, updatedSection);
}

export function createSection(heading: string, content: string): string {
  return `## ${heading}\n\n${content}\n`;
}
