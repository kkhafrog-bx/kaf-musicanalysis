import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Music analysis history table.
 * Stores results from user-uploaded audio files.
 */
export const musicAnalyses = mysqlTable("music_analyses", {
  id: int("id").autoincrement().primaryKey(),
  /** Original filename uploaded by the user */
  fileName: varchar("fileName", { length: 255 }).notNull(),
  /** S3 URL of the uploaded audio file */
  audioUrl: text("audioUrl"),
  /** S3 key of the uploaded audio file */
  audioKey: varchar("audioKey", { length: 512 }),
  /** BPM detected */
  bpm: float("bpm"),
  /** Key (e.g. "A#") */
  key: varchar("key", { length: 8 }),
  /** Mode: major or minor */
  mode: varchar("mode", { length: 16 }),
  /** Full key string (e.g. "A# Major") */
  keyFull: varchar("keyFull", { length: 32 }),
  /** Time signature (e.g. "4/4") */
  timeSignature: varchar("timeSignature", { length: 16 }),
  /** Duration string (e.g. "3:57") */
  duration: varchar("duration", { length: 16 }),
  /** Energy level description */
  energyLevel: varchar("energyLevel", { length: 64 }),
  /** Dynamic range description */
  dynamicRange: varchar("dynamicRange", { length: 64 }),
  /** Brightness description */
  brightness: varchar("brightness", { length: 64 }),
  /** Texture description */
  texture: varchar("texture", { length: 64 }),
  /** Rhythm density description */
  rhythmDensity: varchar("rhythmDensity", { length: 64 }),
  /** JSON array of mood tags */
  moodTags: json("moodTags").$type<string[]>(),
  /** JSON array of genre hints */
  genreHints: json("genreHints").$type<string[]>(),
  /** JSON object of generated prompts */
  generatedPrompts: json("generatedPrompts").$type<Record<string, string>>(),
  /** Analysis status */
  status: mysqlEnum("status", ["pending", "analyzing", "done", "error"]).default("pending").notNull(),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MusicAnalysis = typeof musicAnalyses.$inferSelect;
export type InsertMusicAnalysis = typeof musicAnalyses.$inferInsert;

/**
 * LLM 설정 테이블 — 사용자별 LLM API 선택 및 키 저장
 */
export const llmSettings = mysqlTable("llmSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** LLM 제공자: "manus" | "openai" | "google" */
  provider: mysqlEnum("provider", ["manus", "openai", "google"]).default("manus").notNull(),
  /** API 키 (암호화 권장, 현재는 평문 저장) */
  apiKey: text("apiKey"),
  /** OpenAI 모델명 (예: gpt-4, gpt-3.5-turbo) */
  openaiModel: varchar("openaiModel", { length: 64 }).default("gpt-3.5-turbo"),
  /** Google 모델명 (예: gemini-pro) */
  googleModel: varchar("googleModel", { length: 64 }).default("gemini-pro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LLMSettings = typeof llmSettings.$inferSelect;
export type InsertLLMSettings = typeof llmSettings.$inferInsert;
