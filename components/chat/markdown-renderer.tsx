'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <div className="rounded-md overflow-hidden my-2">
                            <div className="bg-gray-800 text-gray-200 text-xs px-4 py-1 flex justify-between items-center">
                                <span>{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                                {...props}
                                style={dracula}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                    margin: 0,
                                    borderRadius: '0 0 0.375rem 0.375rem',
                                    fontSize: '0.9em',
                                }}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code
                            {...props}
                            className={`${className} bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 font-mono text-sm`}
                        >
                            {children}
                        </code>
                    );
                },
                ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
                p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline font-medium"
                    >
                        {children}
                    </a>
                ),
                table: ({ children }) => (
                    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">{children}</table>
                    </div>
                ),
                thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>,
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {children}
                    </th>
                ),
                td: ({ children }) => <td className="px-3 py-2 text-sm text-gray-600 border-t border-gray-100">{children}</td>,
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 italic text-gray-600 bg-gray-50 rounded-r">
                        {children}
                    </blockquote>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
