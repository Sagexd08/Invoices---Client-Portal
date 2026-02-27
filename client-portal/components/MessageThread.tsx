'use client'
import { useState, useRef, useEffect } from 'react'

type Message = {
    id: string
    threadId: string
    authorId: string
    body: string
    createdAt: Date | string
    author: { id: string; name: string | null; email: string; role: string } | null
}

type Props = {
    threadId: string
    initialMessages: Message[]
    currentUserId: string
}

function initials(a: Message['author']) {
    if (!a) return '?'
    const n = a.name ?? a.email
    return n.slice(0, 2).toUpperCase()
}

export default function MessageThread({ threadId, initialMessages, currentUserId }: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function send(e: React.FormEvent) {
        e.preventDefault()
        if (!body.trim()) return
        setSending(true)
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId, body }),
        })
        if (res.ok) {
            const msg = await res.json()
            setMessages(prev => [...prev, msg])
            setBody('')
        }
        setSending(false)
    }

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3>Messages</h3>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 300, maxHeight: 480, overflowY: 'auto' }}>
                {messages.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                        No messages yet. Start the conversation.
                    </div>
                )}
                {messages.map(msg => {
                    const isMe = msg.authorId === currentUserId
                    return (
                        <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                background: isMe ? 'var(--amber-bg)' : 'var(--bg-3)',
                                border: `1px solid ${isMe ? 'var(--amber-dim)' : 'var(--border-2)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6875rem', fontWeight: 700,
                                color: isMe ? 'var(--amber)' : 'var(--text-2)',
                            }}>
                                {initials(msg.author)}
                            </div>
                            <div style={{ maxWidth: '70%' }}>
                                <div style={{
                                    background: isMe ? 'var(--amber-bg)' : 'var(--bg-3)',
                                    border: `1px solid ${isMe ? 'rgba(245,158,11,.2)' : 'var(--border)'}`,
                                    borderRadius: 10,
                                    padding: '9px 13px',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    color: 'var(--text)',
                                }}>
                                    {msg.body}
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                                    {msg.author?.name ?? msg.author?.email} · {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={send} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <input
                    className="input"
                    placeholder="Write a message…"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    disabled={sending}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !body.trim()}>
                    {sending ? '…' : 'Send'}
                </button>
            </form>
        </div>
    )
}
