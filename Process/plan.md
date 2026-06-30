# MemoryVerse - Development Plan

## Project Vision

MemoryVerse is **not** a cloud storage platform.

It is an AI-powered Memory Operating System that understands a person's academic and professional journey.

Traditional cloud storage stores files.

MemoryVerse stores **knowledge**.

Every uploaded file becomes an intelligent memory that can be:

* Understood
* Categorized
* Connected
* Retrieved
* Visualized
* Queried naturally

The original document is always preserved while an AI-generated knowledge layer is created on top of it.

The end goal is that a user never has to remember where they stored something. They only need to remember what they are looking for.

---

# Product Philosophy

MemoryVerse should feel like:

* Notion understands your documents
* GitHub understands your projects
* LinkedIn understands your career
* Obsidian understands your knowledge
* Google Drive stores your files

MemoryVerse combines all of these into one intelligent system.

Instead of folders, users interact with memories.

Instead of filenames, users interact with knowledge.

Instead of manually organizing documents, AI continuously organizes and improves the repository.

---

# Core Product Idea

Every uploaded item becomes a **Memory Object**.

A Memory Object consists of:

Original File

↓

Extracted Text

↓

Structured Metadata

↓

Semantic Embedding

↓

Relationships

↓

Timeline Event

↓

Knowledge Graph Node

↓

Searchable AI Memory

The original file is never modified.

Instead, AI continuously enriches it with additional intelligence.

---

# Product Goals

The platform should solve five major problems.

## 1. Intelligent Organization

The user should never manually organize files.

Every upload should automatically be classified.

Examples:

Certificate

Resume

Project

Internship

Research

Achievement

Academic Record

Portfolio

GitHub Repository

Skills

The classification should happen automatically using AI.

---

## 2. Knowledge Connections

MemoryVerse should understand relationships between memories.

Examples:

AWS Certificate

↓

Cloud Computing Skill

↓

Cloud Migration Project

↓

Internship

↓

Resume

↓

Current Career Goals

Relationships should continuously grow as more files are uploaded.

---

## 3. Instant Retrieval

Users should retrieve information using natural language.

Examples:

Show every AI project.

Show my certificates.

Which internship taught me SQL?

Where did I first use React?

Show documents related to Machine Learning.

The user should never browse folders again.

---

## 4. Personal Growth Timeline

Every upload should update a timeline.

Example

2020

Higher Secondary

↓

2023

Bachelor's Degree

↓

Python Certification

↓

Machine Learning Project

↓

Internship

↓

Hackathon

↓

Master's Degree

↓

MemoryVerse

The timeline should be completely AI generated.

---

## 5. Living Knowledge Graph

Every memory becomes part of a connected graph.

Example

Python

↓

Certificate

↓

Project

↓

Internship

↓

Resume

↓

GitHub Repository

↓

Current Skillset

The graph should continuously evolve.

---

# AI Pipeline

Every uploaded document follows the exact same pipeline.

Upload

↓

Storage

↓

OCR (if required)

↓

Text Extraction

↓

Metadata Extraction

↓

Classification

↓

Embedding Generation

↓

Relationship Detection

↓

Timeline Update

↓

Knowledge Graph Update

↓

Search Index Update

↓

Dashboard Refresh

This pipeline should work for every document regardless of format.

---

# Recommended Technology Stack

Frontend

React

Vite

TypeScript

TailwindCSS

shadcn/ui

React Query

React Router

Framer Motion

---

Backend

Supabase

---

Authentication

Supabase Auth

Google OAuth

---

Database

Supabase PostgreSQL

---

Storage

Supabase Storage

---

Vector Search

pgvector

---

Embeddings

Preferred:

nomic-embed-text

Alternative:

BAAI/bge-small-en-v1.5

Run locally using Ollama.

---

Large Language Model

Preferred

Gemma

Llama 3.1

Qwen

through Ollama.

Fallback

Gemini Free API.

---

OCR

Tesseract

or

Unstructured

depending on file type.

---

Relationship Engine

LLM-generated knowledge triples.

Example

Project

USES

Python

Certificate

TEACHES

Python

Internship

REQUIRES

Python

Resume

MENTIONS

Python

These relationships become graph edges.

---

Knowledge Graph

Store graph nodes and relationships.

Render an interactive graph in the frontend.

Every upload should expand the graph.

---

Timeline Engine

Automatically create chronological events from extracted dates.

Timeline should update itself after every upload.

---

Semantic Search

Use embeddings.

Never rely on filename search.

Search should understand meaning.

---

AI Assistant

Instead of "Chat with PDF"

Create an assistant that understands the user's entire digital journey.

Examples

What is my strongest skill?

Which internship is most relevant to AI?

Which projects should I showcase?

What certifications are missing from my resume?

Suggest improvements to my portfolio.

---

Smart Recommendations

After every upload the AI should provide useful insights.

Examples

This internship is not mentioned in your resume.

Three projects use React.

This certificate strengthens your AI profile.

Your latest resume is older than your newest internship.

You have multiple projects using Python but only one certificate.

These recommendations should feel like career coaching rather than file management.

---

Dashboard

Instead of showing folders.

Display

Total Memories

Projects

Certificates

Internships

Achievements

Skills

Connections Created

Timeline Events

Recent Uploads

AI Suggestions

Knowledge Health Score

Relationship Growth

Timeline Growth

---

Demo Flow

The demo should immediately communicate the product's value.

Upload an internship letter.

AI extracts:

Company

Role

Skills

Dates

Technologies

The timeline updates.

The knowledge graph expands.

The dashboard updates.

AI recommends adding the internship to the resume.

The user asks:

"Show everything connected to this internship."

MemoryVerse instantly displays:

Projects

Skills

Certificates

Resume

GitHub

Timeline

Original PDF

The final impression should be:

"I never have to search through folders again."

---

Development Roadmap

The project will be implemented in five phases.

Phase 1

Architecture and Foundation

Database design

Folder structure

Authentication

Supabase configuration

Storage setup

Core UI layout

---

Phase 2

AI Data Ingestion

Document upload

OCR

Text extraction

Metadata extraction

Automatic categorization

---

Phase 3

Knowledge Intelligence

Embeddings

Vector search

Relationship engine

Knowledge graph

Timeline engine

Semantic indexing

---

Phase 4

Product Experience

Dashboard

Search

Timeline

Knowledge graph

AI assistant

Recommendations

Responsive UI

Animations

Dark mode

---

Phase 5

Production Readiness

Documentation

Architecture diagrams

Testing

Deployment

README

Thought process

Demo optimization

Performance improvements

Hackathon submission assets

---

Development Principles

* Every feature must solve a real user problem.
* Prioritize user experience over unnecessary complexity.
* Keep the architecture modular and scalable.
* Use free and open-source tools wherever possible.
* Ensure AI decisions are explainable and traceable.
* Preserve original files while enriching them with intelligence.
* Build a product that could realistically evolve into a commercial SaaS platform after the hackathon.


