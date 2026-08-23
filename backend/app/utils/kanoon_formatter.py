"""Indian Kanoon Document Formatter.

Converts raw HTML returned by the Indian Kanoon API into clean, structured Markdown.
Preserves headings, quotes, citations, bold text, lists, and removes unwanted tags/scripts.
"""

import html
import re
from html.parser import HTMLParser


class _KanoonHTMLToMarkdownParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.output: list[str] = []
        self.tag_stack: list[str] = []
        self.in_script = False
        self.in_style = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag_lower = tag.lower()
        self.tag_stack.append(tag_lower)

        if tag_lower in ("script", "style", "noscript"):
            self.in_script = True
            return

        if tag_lower in ("h1", "h2"):
            self.output.append("\n\n## ")
        elif tag_lower in ("h3", "h4"):
            self.output.append("\n\n### ")
        elif tag_lower in ("h5", "h6"):
            self.output.append("\n\n#### ")
        elif tag_lower in ("p", "div"):
            self.output.append("\n\n")
        elif tag_lower == "br":
            self.output.append("\n")
        elif tag_lower in ("b", "strong"):
            self.output.append(" **")
        elif tag_lower in ("i", "em"):
            self.output.append(" *")
        elif tag_lower == "blockquote":
            self.output.append("\n\n> ")
        elif tag_lower == "li":
            self.output.append("\n- ")
        elif tag_lower == "hr":
            self.output.append("\n\n---\n\n")

    def handle_endtag(self, tag: str) -> None:
        tag_lower = tag.lower()
        if self.tag_stack and self.tag_stack[-1] == tag_lower:
            self.tag_stack.pop()

        if tag_lower in ("script", "style", "noscript"):
            self.in_script = False
            return

        if tag_lower in ("b", "strong"):
            self.output.append("** ")
        elif tag_lower in ("i", "em"):
            self.output.append("* ")
        elif tag_lower in ("p", "div", "h1", "h2", "h3", "h4", "h5", "h6"):
            self.output.append("\n")

    def handle_data(self, data: str) -> None:
        if self.in_script:
            return
        if data:
            self.output.append(data)


def convert_kanoon_html_to_markdown(raw_html: str, title: str | None = None, docsource: str | None = None, publishdate: str | None = None) -> str:
    """Convert raw Indian Kanoon HTML to clean, formatted Markdown.
    
    Args:
        raw_html: The HTML string from Kanoon API's 'doc' field.
        title: Optional document/case title.
        docsource: Optional court name / source.
        publishdate: Optional judgment date.
    
    Returns:
        Structured Markdown representation of the court document.
    """
    if not raw_html or not raw_html.strip():
        return "*No document text available from Indian Kanoon.*"

    # Pre-clean known Kanoon wrapper patterns
    cleaned_html = raw_html
    # Remove script and style blocks directly
    cleaned_html = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', cleaned_html, flags=re.IGNORECASE)
    cleaned_html = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', '', cleaned_html, flags=re.IGNORECASE)

    # Parse HTML to Markdown
    parser = _KanoonHTMLToMarkdownParser()
    parser.feed(cleaned_html)
    raw_md = "".join(parser.output)

    # Unescape HTML entities
    decoded_md = html.unescape(raw_md)

    # Post-process Markdown formatting
    # 1. Normalize multiple blank lines to at most 2
    decoded_md = re.sub(r'\n{3,}', '\n\n', decoded_md)
    # 2. Fix spaced bold/italic markers
    decoded_md = re.sub(r'\*\*\s+', ' **', decoded_md)
    decoded_md = re.sub(r'\s+\*\*', '** ', decoded_md)
    decoded_md = re.sub(r'\*\*\*\*', '', decoded_md)
    # 3. Clean trailing whitespaces per line
    lines = [line.rstrip() for line in decoded_md.split("\n")]
    result_text = "\n".join(lines).strip()

    # Prepend document header if not already in document
    header_parts = []
    if title and title.strip():
        clean_title = re.sub(r'<[^>]+>', '', title).strip()
        if not result_text.startswith(f"# {clean_title}") and not result_text.startswith(f"## {clean_title}"):
            header_parts.append(f"# {clean_title}")

    meta_sub = []
    if docsource and docsource.strip():
        meta_sub.append(f"**Court:** {docsource.strip()}")
    if publishdate and publishdate.strip():
        meta_sub.append(f"**Date:** {publishdate.strip()}")
    if meta_sub:
        header_parts.append(" | ".join(meta_sub))

    if header_parts:
        header_block = "\n\n".join(header_parts) + "\n\n---\n\n"
        if not result_text.startswith("#"):
            result_text = header_block + result_text

    return result_text.strip()
