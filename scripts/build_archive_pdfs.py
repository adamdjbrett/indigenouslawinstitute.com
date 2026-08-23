#!/usr/bin/env python3
"""Build the Indigenous Law Institute's legacy pages as archival PDFs."""

from __future__ import annotations

import ast
import re
import subprocess
import tempfile
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "pdfs"
SOURCES = (
    "ammau.md",
    "constitution.md",
    "dovision.md",
    "global_liberation.md",
    "ictarticl.md",  # requested as lctarticl.md; this is the repository filename
    "ili_info.md",
    "ili-report.md",
    "newstudy.md",
    "peacepact.md",
    "perspect.md",  # requested as persepct.md; this is the repository filename
    "pope.md",
    "ricb.md",
    "rice.md",
    "sdrm_art.md",
)
AUTHORS = {
    "ammau.md": "Nãlani Minton",
    "constitution.md": "Birgil Kills Straight and Steven Newcomb",
    "dovision.md": "The Gathering of the 1003 United Indigenous Peoples",
    "global_liberation.md": "Steve Newcomb",
    "ictarticl.md": "Jerry Reynolds",
    "ili_info.md": "Indigenous Law Institute",
    "ili-report.md": "Steven Newcomb",
    "newstudy.md": "Fred Whitehead",
    "peacepact.md": "Nalani Minton and Steven Newcomb",
    "perspect.md": "Steven Newcomb",
    "pope.md": "Steven T. Newcomb",
    "ricb.md": "Valerie Taliman",
    "rice.md": "Steven T. Newcomb",
    "sdrm_art.md": "Steve Newcomb",
}


def latex(text: str) -> str:
    return "".join(
        {
            "\\": r"\textbackslash{}",
            "&": r"\&",
            "%": r"\%",
            "$": r"\$",
            "#": r"\#",
            "_": r"\_",
            "{": r"\{",
            "}": r"\}",
            "~": r"\textasciitilde{}",
            "^": r"\textasciicircum{}",
        }.get(char, char)
        for char in text
    )


def read_page(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8")
    match = re.fullmatch(r"---\n(.*?)\n---\n(.*)", text, re.DOTALL)
    if not match:
        raise ValueError(f"Missing front matter: {path}")
    metadata: dict[str, str] = {}
    for line in match.group(1).splitlines():
        field = re.match(r"^(title|description|date|permalink):\s*(.*)$", line)
        if field:
            value = field.group(2).strip()
            metadata[field.group(1)] = str(ast.literal_eval(value)) if value[:1] in "\"'" else value
    missing = {"title", "description", "permalink"} - metadata.keys()
    if missing:
        raise ValueError(f"Missing {sorted(missing)} in {path}")
    body = match.group(2).replace("](/img/", "](public/img/")
    body = re.sub(r"(?m)^- - -\s*$", "\\n---\\n", body)
    return metadata, body


def cover(metadata: dict[str, str], permanent_url: str) -> str:
    raw_date = metadata.get("date")
    display_date = date.fromisoformat(raw_date).strftime("%B %-d, %Y") if raw_date else "Undated"
    return rf"""
\begin{{center}}
\rule{{\linewidth}}{{0.6pt}}
\vspace{{0.6em}}

{{\fontsize{{26}}{{31}}\selectfont\bfseries Indigenous Law Institute\par}}
\vspace{{0.6em}}
\rule{{\linewidth}}{{0.6pt}}

\vspace{{2.2em}}
{{\fontsize{{18}}{{22}}\selectfont\bfseries {latex(metadata['title'])}\par}}
\vspace{{0.8em}}
\begin{{adjustbox}}{{max width=\linewidth}}
{{\fontsize{{10}}{{13}}\selectfont {latex(metadata['authors'])} \enspace\textbullet\enspace {latex(display_date)} \enspace\textbullet\enspace \nolinkurl{{{permanent_url}}}}}
\end{{adjustbox}}\par
\end{{center}}

\vspace{{1.8em}}
\noindent\colorbox{{gray!14}}{{\parbox{{\dimexpr\linewidth-2\fboxsep\relax}}{{\color{{black!82}}\strut {latex(metadata['description'])}\strut}}}}
\newpage
"""


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    header_template = (ROOT / "scripts" / "archive-pdf-header.tex").read_text(encoding="utf-8")
    built: list[Path] = []
    with tempfile.TemporaryDirectory(prefix="ili-archive-pdf-") as temp_name:
        temp = Path(temp_name)
        for filename in SOURCES:
            source = ROOT / "content" / "blog" / filename
            metadata, body = read_page(source)
            metadata["authors"] = AUTHORS[filename]
            permanent_url = "https://indigenouslawinstitute.com" + metadata["permalink"]
            markdown = temp / filename
            header = temp / f"{source.stem}-header.tex"
            before = temp / f"{source.stem}-cover.tex"
            markdown.write_text(body, encoding="utf-8")
            header.write_text(
                header_template.replace("ARCHIVEURL", permanent_url)
                .replace("ARCHIVETITLE", latex(metadata["title"]))
                .replace("ARCHIVEAUTHOR", latex(metadata["authors"]))
                .replace("ARCHIVEDESCRIPTION", latex(metadata["description"])),
                encoding="utf-8",
            )
            before.write_text(cover(metadata, permanent_url), encoding="utf-8")
            output = OUTPUT / f"{source.stem}.pdf"
            subprocess.run(
                [
                    "pandoc",
                    str(markdown),
                    "--from=markdown+raw_html",
                    "--pdf-engine=xelatex",
                    "--include-in-header",
                    str(header),
                    "--include-before-body",
                    str(before),
                    "--resource-path",
                    str(ROOT),
                    "--metadata",
                    f"pagetitle={metadata['title']}",
                    "--metadata",
                    "author=Indigenous Law Institute",
                    "--variable",
                    "papersize=letter",
                    "--variable",
                    "geometry:margin=0.5in",
                    "--variable",
                    "mainfont=Georgia",
                    "--variable",
                    "fontsize=11pt",
                    "--output",
                    str(output),
                ],
                cwd=ROOT,
                check=True,
            )
            built.append(output)
    assert len(built) == len(SOURCES) == 14
    assert AUTHORS.keys() == set(SOURCES)
    assert all(path.stat().st_size > 10_000 for path in built)
    print("\n".join(str(path.relative_to(ROOT)) for path in built))


if __name__ == "__main__":
    main()
