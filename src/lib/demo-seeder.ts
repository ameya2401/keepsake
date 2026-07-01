// ============================================================
// Keepsake — Demo Data Seeder
// Seeds realistic sample data so judges can explore immediately
// ============================================================

import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────
// Demo document templates
// ─────────────────────────────────────────────────────────────

const DEMO_DOCUMENTS = [
  {
    title: 'Google Summer of Code — Machine Learning Internship',
    category: 'internship',
    processing_status: 'completed',
    file_type: 'application/pdf',
    file_size: 245000,
    ai_summary: 'Internship at Google working on TensorFlow optimization for edge devices. Improved inference speed by 40% on mobile platforms.',
    tags: ['internship', 'machine-learning', 'tensorflow', 'python', 'google'],
    metadata: {
      title: 'Google Summer of Code — Machine Learning Internship',
      organization: 'Google',
      role: 'ML Engineering Intern',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'CUDA', 'Docker'],
      technologies: ['TensorFlow', 'Kubernetes', 'GCP', 'JAX'],
      start_date: '2024-05-15',
      end_date: '2024-08-15',
      document_type: 'internship',
      achievements: ['Improved inference speed by 40%', 'Published internal research note'],
    },
    timeline_event: {
      title: 'ML Engineering Intern at Google',
      event_type: 'internship',
      event_date: '2024-05-15',
      description: 'Worked on TensorFlow optimization for edge devices during GSoC.',
      location: 'Remote (Bangalore)',
      organization: 'Google',
    },
  },
  {
    title: 'AWS Certified Solutions Architect — Associate',
    category: 'certificate',
    processing_status: 'completed',
    file_type: 'application/pdf',
    file_size: 182000,
    ai_summary: 'AWS certification validating expertise in designing distributed systems on Amazon Web Services.',
    tags: ['aws', 'cloud', 'certification', 'devops', 'infrastructure'],
    metadata: {
      title: 'AWS Certified Solutions Architect — Associate',
      organization: 'Amazon Web Services',
      skills: ['AWS', 'Cloud Architecture', 'EC2', 'S3', 'Lambda', 'RDS'],
      technologies: ['AWS', 'CloudFormation', 'Terraform'],
      issue_date: '2024-03-10',
      expiry_date: '2027-03-10',
      document_type: 'certificate',
      credential_id: 'AWS-SA-2024-XXX',
    },
    timeline_event: {
      title: 'AWS Solutions Architect Certification',
      event_type: 'achievement',
      event_date: '2024-03-10',
      description: 'Passed the AWS SAA-C03 exam with a score of 876/1000.',
      organization: 'Amazon Web Services',
    },
  },
  {
    title: 'Distributed Task Queue — Open Source Project',
    category: 'project',
    processing_status: 'completed',
    file_type: 'application/pdf',
    file_size: 320000,
    ai_summary: 'Open source distributed task queue built with Python, Redis, and FastAPI. 850+ GitHub stars. Handles 50k+ tasks/minute.',
    tags: ['python', 'redis', 'fastapi', 'distributed-systems', 'open-source'],
    metadata: {
      title: 'Distributed Task Queue',
      skills: ['Python', 'Redis', 'FastAPI', 'Docker', 'Celery'],
      technologies: ['Python', 'Redis', 'FastAPI', 'PostgreSQL', 'Docker'],
      document_type: 'project',
      achievements: ['850+ GitHub stars', '50k+ tasks/minute throughput', 'Featured on HackerNews'],
    },
    timeline_event: {
      title: 'Open sourced Distributed Task Queue',
      event_type: 'project',
      event_date: '2023-11-01',
      description: 'Released v1.0 of distributed task queue library to open source community.',
      organization: null,
    },
  },
  {
    title: 'National Hackathon — First Place Winner',
    category: 'achievement',
    processing_status: 'completed',
    file_type: 'application/pdf',
    file_size: 156000,
    ai_summary: 'First place at the National AI Hackathon 2024. Built a real-time sign language translation app using computer vision.',
    tags: ['hackathon', 'winner', 'computer-vision', 'ai', 'react'],
    metadata: {
      title: 'National AI Hackathon — First Place',
      organization: 'TechFest India',
      skills: ['Computer Vision', 'React', 'Python', 'MediaPipe'],
      technologies: ['MediaPipe', 'TensorFlow.js', 'React', 'FastAPI'],
      issue_date: '2024-01-20',
      document_type: 'achievement',
      achievements: ['First Place out of 250 teams', 'Prize: ₹1,00,000'],
    },
    timeline_event: {
      title: 'Won National AI Hackathon 2024',
      event_type: 'achievement',
      event_date: '2024-01-20',
      description: 'First place out of 250 teams. Built real-time sign language translation.',
      organization: 'TechFest India',
    },
  },
  {
    title: 'Software Engineering Resume — 2024',
    category: 'resume',
    processing_status: 'completed',
    file_type: 'application/pdf',
    file_size: 98000,
    ai_summary: 'Software engineering resume highlighting 3 years of backend development experience, cloud expertise, and open source contributions.',
    tags: ['resume', 'backend', 'python', 'aws', 'software-engineering'],
    metadata: {
      title: 'Software Engineering Resume — 2024',
      skills: ['Python', 'Go', 'TypeScript', 'React', 'AWS', 'PostgreSQL'],
      technologies: ['FastAPI', 'Django', 'React', 'Docker', 'Kubernetes'],
      document_type: 'resume',
      years_experience: 3,
    },
    timeline_event: null,
  },
]

const DEMO_SKILLS = [
  { name: 'Python', document_count: 4, skill_type: 'technical' },
  { name: 'AWS', document_count: 3, skill_type: 'technical' },
  { name: 'React', document_count: 3, skill_type: 'technical' },
  { name: 'Machine Learning', document_count: 2, skill_type: 'technical' },
  { name: 'Docker', document_count: 3, skill_type: 'technical' },
  { name: 'FastAPI', document_count: 2, skill_type: 'technical' },
  { name: 'PostgreSQL', document_count: 2, skill_type: 'technical' },
  { name: 'Computer Vision', document_count: 1, skill_type: 'technical' },
  { name: 'TypeScript', document_count: 2, skill_type: 'technical' },
  { name: 'Redis', document_count: 1, skill_type: 'technical' },
  { name: 'Communication', document_count: 2, skill_type: 'soft' },
  { name: 'Problem Solving', document_count: 3, skill_type: 'soft' },
]

// ─────────────────────────────────────────────────────────────
// Seed function
// ─────────────────────────────────────────────────────────────

export async function seedDemoData(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if demo data already exists
    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('user_id', userId)
      .eq('tags', ['demo'])
      .limit(1)

    if (existing && existing.length > 0) {
      return { success: true } // Already seeded
    }

    // Insert documents
    const docInserts = DEMO_DOCUMENTS.map((doc) => ({
      user_id: userId,
      title: doc.title,
      category: doc.category,
      processing_status: doc.processing_status,
      file_type: doc.file_type,
      file_size: doc.file_size,
      ai_summary: doc.ai_summary,
      tags: [...doc.tags, 'demo'],
      metadata: doc.metadata,
      file_path: `demo/${userId}/${doc.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    }))

    const { data: insertedDocs, error: docError } = await supabase
      .from('documents')
      .insert(docInserts)
      .select('id, category')

    if (docError) throw new Error(docError.message)

    const docIds = insertedDocs?.map((d) => d.id) || []

    // Insert timeline events
    const timelineInserts = DEMO_DOCUMENTS
      .filter((doc, i) => doc.timeline_event && docIds[i])
      .map((doc, i) => ({
        user_id: userId,
        document_id: docIds[i],
        ...doc.timeline_event!,
      }))

    if (timelineInserts.length > 0) {
      await supabase.from('timeline_events').insert(timelineInserts)
    }

    // Insert skills
    const skillInserts = DEMO_SKILLS.map((skill) => ({
      user_id: userId,
      ...skill,
    }))

    await supabase.from('skills').upsert(skillInserts, {
      onConflict: 'user_id,name',
    })

    // Insert demo recommendations
    const recommendations = [
      {
        user_id: userId,
        type: 'resume_update',
        title: 'Add your hackathon win to your resume',
        description: 'Your National AI Hackathon first-place win is not reflected in your resume. This is a high-impact achievement that demonstrates competitive ability and real-world problem solving.',
        impact: 'high',
        is_dismissed: false,
        document_id: docIds[3] || null,
      },
      {
        user_id: userId,
        type: 'skill_gap',
        title: 'Consider a Kubernetes certification',
        description: 'You use Docker and Kubernetes in several projects but have no certification. A CKA (Certified Kubernetes Administrator) would strongly validate this expertise.',
        impact: 'medium',
        is_dismissed: false,
        document_id: null,
      },
      {
        user_id: userId,
        type: 'portfolio_suggestion',
        title: 'Create a portfolio document for your open source work',
        description: 'Your distributed task queue project has 850+ GitHub stars. A dedicated portfolio document would help Keepsake better cross-reference this achievement against your resume.',
        impact: 'medium',
        is_dismissed: false,
        document_id: docIds[2] || null,
      },
    ]

    await supabase.from('recommendations').insert(recommendations)

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Demo seed failed'
    console.error('[DemoSeeder]', msg)
    return { success: false, error: msg }
  }
}

// ─────────────────────────────────────────────────────────────
// Clear demo data
// ─────────────────────────────────────────────────────────────

export async function clearDemoData(userId: string): Promise<void> {
  // Delete documents tagged as demo (cascade will remove related records)
  await supabase
    .from('documents')
    .delete()
    .eq('user_id', userId)
    .contains('tags', ['demo'])
}
