"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface Comment {
    _id: string;
    userName: string;
    userImage?: string;
    content: string;
    createdAt: string;
    userId: string;
}

interface CollaborationPanelProps {
    entityId: string;
    language?: string;
}

export function CollaborationPanel({ entityId, language = 'es' }: CollaborationPanelProps) {
    const t = useTranslations('common.collaboration');
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const dateLocale = language === 'es' ? es : enUS;

    useEffect(() => {
        fetchComments();
    }, [entityId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/entities/${entityId}/comments`);
            const data = await res.json();
            if (data.success) {
                setComments(data.data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newComment.trim()) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/entities/${entityId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            const data = await res.json();
            if (data.success) {
                setComments([...comments, data.data]);
                setNewComment('');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="border-none shadow-xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 p-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                    </div>
                    <CardTitle className="text-lg font-bold">Discusion Técnica</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[430px] p-4">
                    {isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse flex gap-3">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-1/4" />
                                        <div className="h-10 bg-slate-100 rounded w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                            <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm font-medium">No hay comentarios aún.</p>
                            <p className="text-xs">Inicia la discusión sobre este análisis.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {comments.map((comment) => (
                                <div key={comment._id} className="flex gap-3 group animate-in fade-in slide-in-from-left-2">
                                    <Avatar className="w-8 h-8 border border-white shadow-sm">
                                        <AvatarImage src={comment.userImage} />
                                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                                            {comment.userName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                {comment.userName}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: dateLocale })}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm text-sm text-slate-700 dark:text-slate-300">
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                <div className="w-full flex flex-col gap-2">
                    <Textarea
                        placeholder="Escribe un comentario o duda técnica..."
                        className="min-h-[80px] resize-none border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            disabled={!newComment.trim() || isSending}
                            onClick={handleSend}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl transition-all"
                        >
                            {isSending ? (
                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> Enviar</>
                            )}
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
