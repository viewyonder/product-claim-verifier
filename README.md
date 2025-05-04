# Product Claim Verifier

Triangulates product claims made in vendor collateral and 3rd party public and private information against the vendor's product codebase.

## 1. Product Overview

### 1.1 Purpose

Product Claim Verifier CLI (MVP) is a command-line tool for Chief Technology Officers (CTOs) to verify user-provided product claims against a GitHub repository’s codebase. It uses Node.js for processing and an LLM for analysis, providing a text-based proof-of-concept for claim verification before building a web interface.

### 1.2 Problem Statement

CTOs need a quick way to check if vendor product claims match their codebase implementations, but manual code reviews are time-consuming, and processing irrelevant files wastes resources. A CLI prototype validates core functionality without a UI.

### 1.3 Objectives

* Transform user-input claims into a structured <claims /> format.
* Efficiently download, index, and analyze a GitHub repository’s relevant files.
* Use an LLM to verify claims against the codebase with minimal token usage.
* Deliver a text-based report linking claims to code evidence.

## 2. Target Audience

* Primary Users: CTOs and developers testing the tool’s feasibility.
* Secondary Users: Engineering teams validating claims.
* Stakeholders: Product and development teams.

## 3. User Stories

* As a CTO, I want to input claims via a file or command-line argument so that they are structured for analysis.
* As a CTO, I want to provide a GitHub repo URL and analyze only relevant files (e.g., code, docs) to avoid processing binaries or images.
* As a CTO, I want a text-based report showing which claims are supported or unsupported by the codebase.
* As a CTO, I want the analysis to be cost-efficient and fast.

## 4. Functional Requirements

### 4.1 Claim Input and Structuring

* Users input claims via a text file (e.g., claims.txt, one claim per line) or a comma-separated string via a CLI argument.
* The system parses claims into a JSON structure: { claims: [{ id: number, text: string }] }.
* Structured claims are printed to the console as a <claims /> XML-like format (e.g., <claims><claim id="1">Text</claim></claims>).

### 4.2 Repository Download and Indexing

* Users input a public GitHub repository URL via a CLI argument (e.g., --repo "https://github.com/owner/repo").
* The tool downloads the repo as a ZIP file from https://github.com/owner/repo/archive/main.zip.
* The ZIP is extracted (up to a 50 MB unzipped size limit), and an index of files is generated, including path, extension, and size.
* Files are filtered based on:
    * Included Folders: /src, /lib, /app, /docs, /tests, /examples, root-level files (e.g., README.md).
    * Included Extensions: .js, .ts, .py, .java, .md, .txt, .json, .yaml, .yml, .html, .css.
    * Excluded Folders: /node_modules, /dist, /build, /vendor, /public, /assets.
    * Excluded Extensions: .exe, .png, .jpg, .gif, .pdf, .zip, .tar, .gz, .bin, .o, .a.
    * Size Limit: Exclude files >1 MB.
* Filtered file paths are printed to the console.

### 4.3 Codebase Analysis

* The tool reads the contents of filtered files, concatenating text with file path headers (e.g., // File: src/code.js).
* Total text is capped at 100,000 tokens (using a character-based estimator or tiktoken).
* The concatenated text is prepared for LLM processing.

### 4.4 Claim Verification

* The tool sends claims and codebase text to an LLM (e.g., via xAI’s Grok API or a mock function for MVP).
* The LLM analyzes the codebase to identify evidence supporting or refuting each claim.
* Output is structured: { claim: string, status: "Supported|Unsupported|Ambiguous", evidence: string, explanation: string }.

### 4.5 Reporting

* The tool prints a report to the console, listing each claim, its status, evidence, and explanation in JSON format.
* Optionally, the report is saved to a file (e.g., report.json).

## 5. Non-Functional Requirements

* Performance: Index a 50 MB repo in <10 seconds; complete analysis in <5 minutes.
* Scalability: Support single-user execution for MVP.
* Security: Delete temporary files after analysis; no storage of repo data.
* Usability: Clear CLI help text and error messages.
* Cost Efficiency: Limit LLM token usage to 100,000 per analysis.

## 6. Technical Considerations

* CLI Framework: commander for command parsing and help text.
* Backend: Node.js with:
    * node-fetch for downloading ZIP files.
    * adm-zip for ZIP extraction and indexing.
    * fs for reading filtered files.
    * tiktoken (optional) for token estimation; fallback to character-based counting.
* LLM Integration: Mock LLM function for MVP; prepare for xAI’s Grok API (see https://x.ai/api for details).
* Prompts:
    * System: “You are a code analysis expert. Verify claims against a codebase, providing concise evidence and explanations. Use file paths for context.”
    * User: “Claims: {claims}. Codebase: {codebase_text}. For each claim, return: claim, status (Supported|Unsupported|Ambiguous), evidence, explanation.”
* Limits:
    * Repository: 50 MB unzipped.
    * Per File: 1 MB.
    * Tokens: 100,000 per LLM call.
* Error Handling: Handle invalid repo URLs, oversized repos, missing claims, or no relevant files.

## 7. Success Metrics

* Functionality: Successfully parse claims, index and analyze a 50 MB repo, and produce a report.
* Accuracy: Mock LLM output matches expected format; real LLM (if integrated) identifies evidence for 80% of test claims.
* Cost: Keep mock processing costs negligible; real LLM costs below $0.50 per analysis.
* Completion Time: CLI prototype delivered in 2 weeks.

## 8. Assumptions and Constraints

* Assumptions:
    * Public GitHub repos are accessible without authentication.
    * Filtered files (e.g., .js, .md) contain most claim-relevant information.
    * 50 MB repo and 1 MB file limits are sufficient for MVP.
* Constraints:
    * No private repo support in MVP.
    * Limited to specified text file extensions.
    * LLM integration is mocked or dependent on xAI’s Grok API.

## 9. Future Considerations

* Integrate Astro-based web UI.
* Use embeddings for efficient code search.
* Support private repos with GitHub OAuth.
* Expand file type support and increase size limits.

## 10. Next Steps

* Validate PRD with stakeholders.
* Implement CLI prototype using commander, adm-zip, and mock LLM.
* Test with sample repos (e.g., expressjs/express) and claims.
* Plan Astro UI integration post-CLI validation.
