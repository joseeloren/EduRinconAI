import { pgTable, text, timestamp, uuid, varchar, pgEnum, integer, jsonb, vector } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'TEACHER', 'STUDENT']);
export const documentStatusEnum = pgEnum('document_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);

// Users Table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull().default('STUDENT'),
    passwordHash: text('password_hash').notNull(),
    emailVerified: timestamp('email_verified'),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NextAuth tables
export const accounts = pgTable('accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
});

export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expires: timestamp('expires').notNull(),
});

// Assistants Table
export const assistants = pgTable('assistants', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    systemPrompt: text('system_prompt').notNull(),
    createdById: uuid('created_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    isPublic: integer('is_public').default(0).notNull(), // 0 = private, 1 = public
    temperature: integer('temperature').default(70).notNull(), // 0-100 for UI, divide by 100 for API
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Assistant Access (Many-to-Many: Students <-> Assistants)
export const assistantAccess = pgTable('assistant_access', {
    id: uuid('id').defaultRandom().primaryKey(),
    assistantId: uuid('assistant_id').notNull().references(() => assistants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at').defaultNow().notNull(),
    grantedById: uuid('granted_by_id').notNull().references(() => users.id),
});

// Documents Table
export const documents = pgTable('documents', {
    id: uuid('id').defaultRandom().primaryKey(),
    filename: varchar('filename', { length: 255 }).notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: integer('size').notNull(), // in bytes
    uploadedById: uuid('uploaded_by_id').notNull().references(() => users.id),
    assistantId: uuid('assistant_id').notNull().references(() => assistants.id, { onDelete: 'cascade' }),
    status: documentStatusEnum('status').default('PENDING').notNull(),
    processingError: text('processing_error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Embeddings Table (Vector Storage)
export const embeddings = pgTable('embeddings', {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
    chunkText: text('chunk_text').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    embedding: vector('embedding', { dimensions: 768 }), // nomic-embed-text produces 768-dim vectors
    metadata: jsonb('metadata'), // Store page number, section, etc.
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Chats Table
export const chats = pgTable('chats', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    assistantId: uuid('assistant_id').notNull().references(() => assistants.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).default('New Chat').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages Table
export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    sources: jsonb('sources'), // Array of {documentId, documentName, chunkText, similarity}
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    createdAssistants: many(assistants, { relationName: 'creator' }),
    assignedAssistants: many(assistantAccess, { relationName: 'studentAssignments' }),
    grantedAssignments: many(assistantAccess, { relationName: 'granterAssignments' }),
    uploadedDocuments: many(documents),
    chats: many(chats),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const assistantsRelations = relations(assistants, ({ one, many }) => ({
    creator: one(users, {
        fields: [assistants.createdById],
        references: [users.id],
        relationName: 'creator',
    }),
    assignments: many(assistantAccess),
    documents: many(documents),
    chats: many(chats),
}));

export const assistantAccessRelations = relations(assistantAccess, ({ one }) => ({
    assistant: one(assistants, {
        fields: [assistantAccess.assistantId],
        references: [assistants.id],
    }),
    user: one(users, {
        fields: [assistantAccess.userId],
        references: [users.id],
        relationName: 'studentAssignments',
    }),
    grantedBy: one(users, {
        fields: [assistantAccess.grantedById],
        references: [users.id],
        relationName: 'granterAssignments',
    }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
    uploadedBy: one(users, {
        fields: [documents.uploadedById],
        references: [users.id],
    }),
    assistant: one(assistants, {
        fields: [documents.assistantId],
        references: [assistants.id],
    }),
    embeddings: many(embeddings),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
    document: one(documents, {
        fields: [embeddings.documentId],
        references: [documents.id],
    }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
    user: one(users, {
        fields: [chats.userId],
        references: [users.id],
    }),
    assistant: one(assistants, {
        fields: [chats.assistantId],
        references: [assistants.id],
    }),
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    chat: one(chats, {
        fields: [messages.chatId],
        references: [chats.id],
    }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Assistant = typeof assistants.$inferSelect;
export type NewAssistant = typeof assistants.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Embedding = typeof embeddings.$inferSelect;
export type NewEmbedding = typeof embeddings.$inferInsert;
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
