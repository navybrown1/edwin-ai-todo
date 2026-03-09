import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

const defaultTasks = [
  { text: "Pay off Americu account",                         cat: "💰 Financial" },
  { text: "Pay all credit cards",                            cat: "💰 Financial" },
  { text: "Check all credit card benefits",                  cat: "💰 Financial" },
  { text: "Dispute or pay NYC traffic tickets",              cat: "💰 Financial" },
  { text: "Apply for student loan",                          cat: "💰 Financial" },
  { text: "Do 2024 taxes",                                   cat: "💰 Financial" },
  { text: "Proceed legally against Jaqueline (taxes / Ethan)", cat: "⚖️ Legal" },
  { text: "Get Ethan for winter break",                      cat: "👨‍👩‍👦 Family & Kids" },
  { text: "Clarify winter vacation split with Ethan",        cat: "👨‍👩‍👦 Family & Kids" },
  { text: "Buy new dresser for Ethan",                       cat: "👨‍👩‍👦 Family & Kids" },
  { text: "Buy underwear and socks for son",                 cat: "👨‍👩‍👦 Family & Kids" },
  { text: "Get a jacket for Ramon",                          cat: "👨‍👩‍👦 Family & Kids" },
  { text: "Sign kids up for soccer and basketball",          cat: "👨‍👩‍👦 Family & Kids" },
  { text: "Buy ticket for gender reveal",                    cat: "👨‍👩‍👦 Family & Kids" },
  { text: "Send email to professor",                         cat: "🏫 School" },
  { text: "Call Genesis — find the right department",        cat: "🏫 School" },
  { text: "Get Genesis program added",                       cat: "🏫 School" },
  { text: "Apply to USAA (resume ready)",                    cat: "💼 Career" },
  { text: "Continue applying for jobs",                      cat: "💼 Career" },
  { text: "Go to the gym",                                   cat: "🏋️ Health" },
  { text: "Contact Gerardo Espinal about access",            cat: "🔧 Errands" },
  { text: "Visit 25th St between 2nd and 3rd Ave",           cat: "🔧 Errands" },
  { text: "Buy Claude Premium",                              cat: "🔧 Errands" },
  { text: "Create a prompts book",                           cat: "🔧 Errands" },
  { text: "Review OpenRouter API key",                       cat: "💻 Tech & Projects" },
  { text: "Check Void Runner Streamlit app",                 cat: "💻 Tech & Projects" },
  { text: "Review chameleon.html project",                   cat: "💻 Tech & Projects" },
];

export async function POST() {
  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id         SERIAL PRIMARY KEY,
        text       TEXT NOT NULL,
        cat        VARCHAR(150) NOT NULL,
        done       BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS subtasks (
        id       SERIAL PRIMARY KEY,
        task_id  INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        text     TEXT NOT NULL,
        done     BOOLEAN DEFAULT FALSE
      )
    `;

    // Only seed if tasks table is empty
    const { rows } = await sql`SELECT COUNT(*) as count FROM tasks`;
    const count = parseInt(rows[0].count, 10);

    if (count > 0) {
      return NextResponse.json({ message: `DB already has ${count} tasks — skipped seed.` });
    }

    for (const t of defaultTasks) {
      await sql`INSERT INTO tasks (text, cat, done) VALUES (${t.text}, ${t.cat}, false)`;
    }

    return NextResponse.json({ message: `Seeded ${defaultTasks.length} tasks successfully.` });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
