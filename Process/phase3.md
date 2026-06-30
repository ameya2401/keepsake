# Phase 3 - Knowledge Intelligence Engine

## Objective

The objective of this phase is to transform isolated Memory Objects into a connected knowledge network.

MemoryVerse should no longer think in terms of documents.

It should think in terms of:

People

Skills

Projects

Organizations

Technologies

Achievements

Career Progress

Every uploaded memory should increase the intelligence of the entire system.

This phase introduces:

* Embeddings
* Vector Search
* Knowledge Graph
* Relationship Engine
* Timeline Engine
* Semantic Retrieval

No conversational AI yet.

That comes in Phase 4.

---

# Product Philosophy

A document has value.

Connections between documents have much greater value.

MemoryVerse should continuously discover new relationships as the user's knowledge grows.

Every upload should enrich the entire system.

---

# Intelligence Pipeline

Every processed Memory Object should now continue through a second AI pipeline.

Memory Object

↓

Embedding Generation

↓

Vector Storage

↓

Relationship Discovery

↓

Knowledge Graph Update

↓

Timeline Update

↓

Recommendation Engine

↓

Search Index Update

↓

Memory Score Update

↓

Dashboard Refresh

---

# Embedding Generation

Generate semantic embeddings for every Memory Object.

Generate embeddings for:

Original Text

AI Summary

AI Narrative

Structured Metadata

Skills

Projects

Technologies

Store embeddings using PostgreSQL pgvector.

Do not use external vector databases.

Use:

pgvector extension in Supabase.

Preferred embedding model:

nomic-embed-text

Alternative:

BAAI/bge-small-en-v1.5

Run locally with Ollama whenever possible.

Fallback:

Free embedding API only if local inference is unavailable.

---

# Vector Search

Implement semantic search.

Search should understand meaning rather than keywords.

Examples

"Cloud Computing"

should also retrieve

AWS

Azure

Docker

DevOps

Kubernetes

Example

"Everything related to AI"

should return

Projects

Research

Certificates

Skills

Hackathons

Internships

Resume sections

GitHub repositories

Ranking should be based on semantic similarity.

---

# Knowledge Graph

This is the centerpiece of MemoryVerse.

Every extracted entity becomes a graph node.

Examples

Person

Skill

Technology

Project

Internship

Certificate

Achievement

University

Company

Resume

Portfolio

Every relationship becomes an edge.

Examples

USES

CREATED

LEARNT

CERTIFIED_BY

WORKED_AT

MENTIONS

DEPENDS_ON

RELATED_TO

COMPLETED_BEFORE

LEADS_TO

CONTRIBUTES_TO

Store graph data in PostgreSQL tables.

Render an interactive graph in the frontend.

---

# Relationship Engine

Relationships should be AI-generated.

Example

Certificate

↓

Python

↓

Project

↓

Internship

↓

Resume

↓

Career Goal

The relationship engine should continuously evaluate:

Shared skills

Shared technologies

Organizations

Dates

Projects

Semantic similarity

LLM reasoning

Generate confidence scores for every relationship.

Allow relationships to evolve over time.

---

# Knowledge Triples

Instead of storing plain relationships, generate knowledge triples.

Examples

Python

USED_IN

Portfolio Project

AWS Certificate

VALIDATES

Cloud Skill

Internship

DEVELOPED

React Application

Resume

REFERENCES

Internship

Project

USES

Supabase

Each triple should include:

Subject

Predicate

Object

Confidence

Source Memory

Created Time

---

# Timeline Engine

Activate the timeline.

Merge all timeline candidates generated in Phase 2.

Automatically order events chronologically.

Detect duplicate events.

Merge related events.

Examples

Certificate

↓

Project

↓

Internship

↓

Promotion

↓

Hackathon

↓

Current Goals

Users should never manually build their timeline.

---

# Timeline Intelligence

Detect:

Career gaps

Learning streaks

Rapid skill growth

Technology transitions

Domain changes

Example

Python

↓

Machine Learning

↓

NLP

↓

LLM

↓

Agentic AI

Display this evolution visually.

---

# Semantic Search

Build intelligent search.

Queries

Show every AI project.

Where did I use PostgreSQL?

Which internships taught backend development?

Find all certificates related to cloud computing.

Which projects helped me learn React?

Search should work across every memory.

Search should never depend on filenames.

---

# Similar Memory Detection

Every memory should know its nearest neighbors.

Example

AWS Certificate

↓

Cloud Project

↓

DevOps Internship

↓

Resume

↓

Cloud Skills

Display:

Related Memories

on every memory page.

---

# Recommendation Engine

Generate recommendations after every upload.

Examples

This internship is missing from your resume.

This project demonstrates skills from your AWS certification.

These two certificates cover the same technology.

You have three React projects but React is missing from your profile.

This achievement should appear in your portfolio.

Suggestions should improve the user's professional profile.

Never generate generic advice.

---

# Memory Score

Introduce a Memory Health Score.

Factors

Missing Metadata

Broken Relationships

Duplicate Documents

Incomplete Timeline

Missing Skills

Disconnected Memories

Search Quality

Graph Density

Display score from:

0–100

Provide actionable improvements.

---

# Knowledge Density

Measure how connected the knowledge graph is.

Metrics

Connections

Average Relationships

Skills per Project

Projects per Technology

Timeline Completeness

Document Coverage

Visualize growth over time.

---

# AI Reasoning Layer

Enable reasoning across connected memories.

Example

Question

"What skill appears most frequently in my career?"

Reasoning

Projects

*

Certificates

*

Resume

*

Internship

↓

Python

Example

"What project best demonstrates backend experience?"

Reason across:

Projects

Technologies

Internships

Resume

Confidence-based answer.

Do not yet build conversational UI.

Only reasoning APIs.

---

# Graph Visualization

Create interactive graph.

Features

Zoom

Pan

Node Expansion

Relationship Labels

Filtering

Highlight Connected Memories

Search Nodes

Color-code node types.

Animate graph updates after uploads.

---

# Database

Populate

knowledge_nodes

knowledge_edges

embeddings

vector_index

relationship_scores

timeline_events

recommendations

graph_metrics

memory_scores

search_index

---

# Performance

Batch embedding generation.

Cache semantic searches.

Incremental graph updates.

Do not rebuild graph from scratch.

Queue expensive AI jobs.

Optimize vector queries.

---

# Security

Graph should contain only current user's data.

Never mix users.

Secure vector search.

Respect Row Level Security.

---

# Developer Architecture

Create dedicated services.

Embedding Service

↓

Vector Search Service

↓

Relationship Engine

↓

Knowledge Graph Service

↓

Timeline Service

↓

Recommendation Engine

↓

Reasoning API

↓

Metrics Service

Each service should be independently testable.

---

# Documentation

Generate

Knowledge Graph Architecture

Relationship Discovery Flow

Embedding Pipeline

Timeline Generation Flow

Recommendation Engine Design

Vector Search Documentation

Mermaid Diagrams

Entity Relationship Documentation

---

# Acceptance Criteria

Phase 3 is complete when:

✓ Every memory has an embedding.

✓ Semantic search works.

✓ Knowledge graph exists.

✓ Graph updates automatically after uploads.

✓ Relationships are AI-generated.

✓ Timeline is fully functional.

✓ Recommendations are generated.

✓ Similar memories are identified.

✓ Memory Health Score is calculated.

✓ Knowledge Density metrics are visible.

✓ Reasoning APIs exist.

✓ Vector search retrieves semantically relevant memories.

No conversational assistant should exist yet.

At the end of Phase 3, MemoryVerse should understand not only individual documents but also how every document relates to every other document, forming a living, evolving digital representation of the user's academic and professional journey.
