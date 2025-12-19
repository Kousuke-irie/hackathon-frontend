import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, TextField, IconButton, Paper, Stack, CircularProgress } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as api from "../services/api";
import type { User } from "../types/user";

export const ChatScreen = ({ currentUser }: { currentUser: User }) => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // 💡 宣言前に自身を参照できるように useRef を使用して関数を保持する
    const connectWSRef = useRef<() => void>(() => {});

    const connectWS = useCallback(() => {
        const apiBaseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080';
        const wsUrl = apiBaseUrl.replace(/^http/, 'ws') + `/ws/notifications?user_id=${currentUser.id}`;

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "CHAT_MESSAGE" && Number(data.message.sender_id) === Number(userId)) {
                setMessages((prev) => [...prev, data.message]);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket closed. Reconnecting...");
            // 💡 Ref経由で呼び出す
            setTimeout(() => {
                connectWSRef.current();
            }, 5000);
        };
    }, [currentUser.id, userId]);

    // Refに関数を同期させる
    useEffect(() => {
        connectWSRef.current = connectWS;
    }, [connectWS]);

    useEffect(() => {
        if (!userId) return;
        let isMounted = true;
        (async () => {
            if (isMounted) setLoading(true); // 非同期関数内での同期的な呼び出しは許容される
            try {
                const res = await api.fetchChatHistory(currentUser.id, Number(userId));
                if (isMounted) {
                    setMessages(res || []);
                }
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();
        connectWS();
        return () => {
            isMounted = false;
            socketRef.current?.close();
        };
    }, [userId, currentUser.id, connectWS]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 💡 順番を handleKeyDown より前に移動してエラー回避
    const handleSend = async () => {
        if (!input.trim() || !userId) return;
        try {
            const res = await api.sendMessage(currentUser.id, Number(userId), input);
            setMessages((prev) => [...prev, res.data.message]);
            setInput("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await handleSend();
        }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', bgcolor: '#fff' }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>トーク画面</Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f8f9fa' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={24} /></Box>
                ) : (
                    <Stack spacing={2}>
                        {messages.map((m, i) => {
                            const isMine = Number(m.sender_id) === Number(currentUser.id);
                            return (
                                <Box key={i} sx={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            bgcolor: isMine ? '#1a1a1a' : '#fff',
                                            color: isMine ? '#fff' : '#1a1a1a',
                                            borderRadius: isMine ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                            border: isMine ? 'none' : '1px solid #eee'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                                    </Paper>
                                </Box>
                            );
                        })}
                        <div ref={scrollRef} />
                    </Stack>
                )}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fff', display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="メッセージを入力..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    multiline
                    maxRows={3}
                />
                <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    sx={{ bgcolor: input.trim() ? '#1a1a1a' : 'transparent', color: input.trim() ? '#fff' : '#ccc', '&:hover': { bgcolor: '#333' } }}
                >
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
};