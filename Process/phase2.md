# Phase 2 - AI Data Ingestion & Document Intelligence

## Objective

The objective of this phase is to transform uploaded files into structured, searchable, and intelligent Memory Objects.

This phase is **not** about chat.

It is **not** about RAG.

It is about teaching MemoryVerse to understand every uploaded document.

At the end of this phase, every uploaded document should have:

* Original file
* Extracted text
* AI-generated metadata
* Category
* Skills
* Technologies
* Organizations
* Dates
* Confidence score
* Summary
* Structured JSON representation

The original file must always remain preserved.

AI only enriches the document.

Never modifies it.

---

# Product Philosophy

Users upload documents.

MemoryVerse creates memories.

Every upload should feel like the system has learned something new.

Users should never manually categorize anything.

Everything should happen automatically.

---

# Memory Object

Every uploaded file becomes a Memory Object.

A Memory Object contains:

Original File

↓

Extracted Text

↓

Metadata

↓

Entities

↓

Category

↓

Summary

↓

Tags

↓

Timeline Candidate

↓

Embedding Placeholder

↓

Relationship Placeholder

↓

Search Metadata

↓

Processing Status

---

# Supported Upload Types

The system should support:

PDF

DOCX

TXT

Markdown

Images

PNG

JPEG

PPTX

Portfolio URLs

GitHub Repository URLs

LinkedIn Profile URLs (future-ready placeholder)

ZIP archives (future-ready)

Each upload should follow the same AI pipeline.

---

# AI Processing Pipeline

Every upload should pass through the following pipeline.

Upload

↓

Store Original File

↓

Detect File Type

↓

Extract Text

↓

Normalize Content

↓

Detect Language

↓

Extract Metadata

↓

Generate Summary

↓

Classify Document

↓

Extract Skills

↓

Extract Technologies

↓

Extract Organizations

↓

Extract Dates

↓

Extract People

↓

Extract Achievements

↓

Generate Tags

↓

Generate Timeline Candidate

↓

Store Structured Memory

↓

Mark Processing Complete

This pipeline should be asynchronous.

Never block the UI.

---

# Background Job System

Implement AI processing as background jobs.

Document status:

Uploaded

↓

Queued

↓

Processing

↓

Completed

↓

Failed

Show live processing progress in the UI.

Allow retry.

---

# OCR

Implement OCR only when required.

Use:

Tesseract

or

Unstructured

Only perform OCR on scanned documents or images.

Do not OCR searchable PDFs.

Automatically detect document type.

---

# Text Extraction

Extract clean plain text.

Remove unnecessary whitespace.

Preserve:

Headings

Bullet points

Dates

Sections

Tables where possible.

Store extracted text separately from original file.

---

# Metadata Extraction

Use an LLM to extract structured metadata.

Output must always follow JSON schema.

Example

{
"title": "",
"document_type": "",
"issuer": "",
"organization": "",
"location": "",
"issue_date": "",
"completion_date": "",
"skills": [],
"technologies": [],
"projects": [],
"internships": [],
"achievements": [],
"education": [],
"keywords": [],
"confidence": 0.95
}

Always validate generated JSON.

Reject malformed outputs.

Retry when necessary.

---

# Automatic Classification

Classify every document.

Possible categories:

Resume

Certificate

Internship

Project

Research

Academic Transcript

Achievement

Portfolio

Recommendation Letter

Cover Letter

Course Completion

Workshop

Hackathon

Volunteer Work

Other

Classification should be AI-driven.

Never depend on filename.

---

# Skill Extraction

Identify all skills mentioned.

Examples:

Python

React

Machine Learning

SQL

AWS

Node.js

Docker

Git

Data Analysis

Leadership

Communication

Distinguish between:

Technical Skills

Soft Skills

Domain Knowledge

---

# Technology Extraction

Extract tools, frameworks, languages, and platforms.

Examples:

TensorFlow

PyTorch

React

Next.js

Supabase

MongoDB

PostgreSQL

Docker

AWS

Azure

Node.js

Express

Store technologies separately from skills.

---

# Organization Detection

Extract:

Companies

Universities

Communities

Hackathons

Certification Providers

Examples:

Google

Amazon

Microsoft

OpenAI

IIT Bombay

CHESS Consultancy

Coursera

Udemy

Wooble

---

# Date Extraction

Identify:

Issue dates

Start dates

End dates

Submission dates

Graduation dates

Certification dates

Store normalized ISO timestamps.

---

# Achievement Extraction

Examples:

Winner

Runner-up

Top 10

Certified

Published

Lead Organizer

Volunteer

Club Head

Mentor

Research Assistant

---

# AI Summary

Generate a concise summary.

Maximum:

100 words.

Purpose:

Quick preview.

Never replace the original document.

---

# Tag Generation

Automatically generate tags.

Examples:

AI

NLP

Cloud

Machine Learning

Frontend

React

Python

Leadership

Research

Hackathon

Portfolio

---

# Timeline Candidate

Generate a structured timeline event.

Example

Date

↓

Title

↓

Description

↓

Source Document

↓

Confidence

Do not yet insert into the public timeline.

Only prepare candidate events.

Timeline engine comes later.

---

# Processing Dashboard

Create processing UI.

Display:

Queued Jobs

Processing Jobs

Completed Jobs

Failed Jobs

Retry Button

Progress Indicators

Estimated Time

---

# Upload Experience

After upload:

Immediately show document card.

Status:

Processing...

When AI finishes:

Update card automatically.

Show:

Category

Summary

Skills

Tags

Confidence

Processing duration.

---

# Error Handling

Handle:

Unreadable PDF

Encrypted PDF

Empty file

Unsupported format

OCR failure

LLM timeout

Invalid JSON

Partial extraction

Network interruption

Retry failed jobs.

Never lose uploaded documents.

---

# Database Updates

Populate:

documents

document_metadata

processing_jobs

skills

organizations

technologies

document_tags

timeline_candidates

activity_logs

Keep embeddings empty.

Keep knowledge graph empty.

Those are Phase 3.

---

# Performance

Process documents asynchronously.

Support multiple uploads.

Queue AI jobs.

Avoid blocking frontend.

Limit concurrent AI processing.

Optimize OCR only when necessary.

---

# Security

Never expose extracted text publicly.

Respect user ownership.

Secure uploaded files.

Store processing logs.

Avoid sending unnecessary personal data to external APIs.

---

# Developer Architecture

Separate services.

OCR Service

↓

Text Extraction Service

↓

Metadata Extraction Service

↓

Classification Service

↓

Entity Extraction Service

↓

Timeline Candidate Generator

↓

Persistence Layer

Each service should be independently testable.

---

# Documentation

Generate:

AI Pipeline Diagram

Processing Flow Diagram

Extraction JSON Schema

Background Job Architecture

Service Layer Documentation

---

# Acceptance Criteria

Phase 2 is complete when:

✓ User uploads any supported document.

✓ Original file is stored safely.

✓ Text is extracted automatically.

✓ Metadata is generated.

✓ Category is assigned.

✓ Skills are extracted.

✓ Technologies are extracted.

✓ Organizations are extracted.

✓ Dates are extracted.

✓ Summary is generated.

✓ Tags are generated.

✓ Timeline candidate is created.

✓ Processing happens asynchronously.

✓ User sees processing status live.

✓ Structured memory is saved in the database.

No embeddings, vector search, knowledge graph, semantic search, or AI assistant should exist yet.

At the end of Phase 2, MemoryVerse should be capable of understanding documents and converting them into rich Memory Objects, forming the foundation for semantic intelligence in the next phase.
